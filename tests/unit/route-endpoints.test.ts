import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * TESTS DE ENDPOINT:
 *  - PUT /api/carts/[uuid] con `items: []` => VACÍA el carrito de verdad
 *    (deleteMany de todos los items + subtotal 0), atómicamente en una sola
 *    escritura. Con items inválidos de forma (no-array) => 400 sin tocar nada.
 *  - POST /api/auth/forgot-password => rate limit REAL por identidad
 *    normalizada: `3001234567` y `+573001234567` comparten la MISMA cubeta.
 */

const mockDb = vi.hoisted(() => {
  // RateLimit simulado CON persistencia (la cubeta real vive en la tabla):
  // findUnique/upsert/deleteMany sobre un Map. Sin esto la acumulación de
  // intentos no existe y el rate limit no se puede probar.
  const rlRows = new Map<string, any>();
  return {
    cart: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    rateLimit: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => rlRows.get(where.key) ?? null),
      upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
        const key = where.key;
        const prev = rlRows.get(key);
        const next = {
          key,
          attempts: (prev ? update.attempts : create.attempts),
          firstAttempt: prev ? update.firstAttempt : create.firstAttempt,
          blockedUntil: prev ? (update.blockedUntil ?? null) : (create.blockedUntil ?? null),
        };
        rlRows.set(key, next);
        return next;
      }),
      deleteMany: vi.fn().mockImplementation(async ({ where }: any) => {
        rlRows.delete(where.key);
        return {};
      }),
    },
    __resetRateLimit: () => rlRows.clear(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  SESSION_DURATION_HOURS_DEFAULT: 24,
}));

vi.mock('@/lib/cart-validation', () => ({
  validateAndPriceItems: vi.fn(),
  CartValidationError: class CartValidationError extends Error {},
}));

vi.mock('@/lib/customer-auth', () => ({
  requestPasswordReset: vi.fn().mockResolvedValue({ otpSent: true, otpNotConfigured: false }),
  CustomerAuthError: class CustomerAuthError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('@/lib/auth-dual', () => ({
  isPhoneOtpLoginEnabled: vi.fn().mockReturnValue(true),
}));

import { PUT as cartPUT } from '@/app/api/carts/[uuid]/route';
import { POST as forgotPOST } from '@/app/api/auth/forgot-password/route';
import { validateAndPriceItems } from '@/lib/cart-validation';
import { requestPasswordReset } from '@/lib/customer-auth';

const ACTIVE_CART = {
  id: 'cart-1',
  uuid: 'uuid-cart-1',
  isActive: true,
  status: 'activo',
  sessionId: 'guest-session-1',
  userId: null,
  subtotal: 15000,
};

function cartRequest(uuid: string, body: unknown, ip = '10.0.0.1') {
  return new NextRequestShim(`http://localhost/api/carts/${uuid}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'x-session-id': 'guest-session-1', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

/** Request mínimo suficiente para las rutas (evita depender de next/server en tests). */
class NextRequestShim extends Request {
  // NextRequest tiene cookies()/nextUrl; las rutas aquí solo usan headers + json()
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.cart.findUnique.mockResolvedValue({ ...ACTIVE_CART });
  mockDb.cart.update.mockImplementation(({ data }: any) =>
    Promise.resolve({ ...ACTIVE_CART, ...data, items: data.items?.create ?? [] })
  );
  mockDb.__resetRateLimit();
});

describe('ENDPOINT PUT /api/carts/[uuid] — vaciado con items: []', () => {
  const params = { params: Promise.resolve({ uuid: 'uuid-cart-1' }) };

  it('items: [] => deleteMany de TODOS los items y subtotal 0', async () => {
    const res = await cartPUT(cartRequest('uuid-cart-1', { items: [] }), params);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    expect(mockDb.cart.update).toHaveBeenCalledTimes(1);
    const updateArg = mockDb.cart.update.mock.calls[0][0];
    expect(updateArg.data.items.deleteMany).toEqual({});
    expect(updateArg.data.items.create).toEqual([]);
    expect(updateArg.data.subtotal).toBe(0);
  });

  it('items con productos => reemplaza items validados (comportamiento intacto)', async () => {
    (validateAndPriceItems as any).mockResolvedValue({
      validatedItems: [
        { productId: 'p1', variantId: null, variantName: null, variantCode: null, quantity: 2, unitPrice: 5000 },
      ],
      subtotal: 10000,
    });

    await cartPUT(
      cartRequest('uuid-cart-1', { items: [{ productId: 'p1', quantity: 2 }] }),
      params
    );

    const updateArg = mockDb.cart.update.mock.calls[0][0];
    expect(updateArg.data.items.deleteMany).toEqual({});
    expect(updateArg.data.items.create).toHaveLength(1);
    expect(updateArg.data.subtotal).toBe(10000);
  });

  it('items malformado (no-array) => 400 y NINGUNA escritura', async () => {
    const res = await cartPUT(cartRequest('uuid-cart-1', { items: 'trashed' }), params);
    expect(res.status).toBe(400);
    expect(mockDb.cart.update).not.toHaveBeenCalled();
  });

  it('sin items en el body => NO toca los items existentes', async () => {
    await cartPUT(cartRequest('uuid-cart-1', { notes: 'solo notas' }), params);

    const updateArg = mockDb.cart.update.mock.calls[0][0];
    expect(updateArg.data.items).toBeUndefined();
  });
});

describe('ENDPOINT POST /api/auth/forgot-password — rate limit por identidad', () => {
  // Identidad única por test para no contaminar el store global de rate limit
  const LOCAL = '3007778899';

  function forgotReq(phoneOrEmail: string, ip: string) {
    return new NextRequestShim('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ phoneOrEmail }),
    });
  }

  it('permite 5 solicitudes con IPs distintas y bloquea la 6ª (misma identidad)', async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await forgotPOST(forgotReq(LOCAL, `10.9.0.${i}`));
      expect(res.status).toBe(200);
    }

    // 6ª desde otra IP NUEVA => la cubeta por IDENTIDAD bloquea
    const blocked = await forgotPOST(forgotReq(LOCAL, '10.9.0.200'));
    expect(blocked.status).toBe(429);
  });

  it('canonicalización: +57300... y 300... comparten la MISMA cubeta de identidad', async () => {
    // Identidad propia del test (el store de rate limit es global al módulo)
    const LOCAL2 = '3005554433';
    // 5 solicitudes con el formato local
    for (let i = 1; i <= 5; i++) {
      const res = await forgotPOST(forgotReq(LOCAL2, `10.10.0.${i}`));
      expect(res.status).toBe(200);
    }

    // El MISMO número en formato E.164, desde una IP nueva => bloqueado igual
    const blocked = await forgotPOST(forgotReq(`+57${LOCAL2}`, '10.10.0.201'));
    expect(blocked.status).toBe(429);
    expect(requestPasswordReset).toHaveBeenCalledTimes(5); // la 6ª ni siquiera procesa
  });

  it('otra identidad (otro teléfono) NO hereda el bloqueo', async () => {
    for (let i = 1; i <= 5; i++) {
      await forgotPOST(forgotReq('3006665544', `10.11.0.${i}`));
    }
    const other = await forgotPOST(forgotReq('3112223344', '10.11.0.1'));
    expect(other.status).toBe(200);
  });
});
