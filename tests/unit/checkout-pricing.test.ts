import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * CHECKOUT + MOTOR ÚNICO DE PRECIOS.
 * Se mockea `@/lib/db` para controlar la transacción y verificar que
 * OrderItem guarda exactamente el precio resuelto server-side.
 */

const mockDb = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { validateAndPriceItems, CartValidationError } from '@/lib/cart-validation';
import { processCheckout } from '@/lib/checkout';

const product = {
  id: 'p1',
  name: 'Cuaderno Norma 100h',
  sku: 'SKU-100H',
  isActive: true,
  stockStatus: 'disponible',
  stockQuantity: 100,
  minWholesaleQty: 1,
  price: 6000,
  wholesalePrice: 5000,
  variants: [],
};

function makeTx(opts: { profile?: any; productOverrides?: any[] } = {}) {
  return {
    product: {
      findMany: vi.fn().mockResolvedValue([product]),
    },
    user: {
      // Misma respuesta para getActivePriceProfile y resolveOrderCustomer
      findUnique: vi.fn().mockResolvedValue({
        id: 'cust-1',
        name: 'Cliente VIP',
        isActive: true,
        role: 'CUSTOMER',
        phone: null,
        email: null,
        assignedAgentId: null,
        priceProfile: opts.profile ?? null,
      }),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'cust-1', assignedAgentId: null }),
      update: vi
        .fn()
        .mockImplementation(({ data }: any) =>
          Promise.resolve({ id: 'cust-1', name: 'Cliente VIP', isActive: true, phone: null, email: null, assignedAgentId: null, ...data })
        ),
    },
    priceProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    priceProfileProduct: { findMany: vi.fn().mockResolvedValue(opts.productOverrides ?? []) },
    priceProfileVariant: { findMany: vi.fn().mockResolvedValue([]) },
    shippingRoute: { findMany: vi.fn().mockResolvedValue([]) },
    order: {
      count: vi.fn().mockResolvedValue(3),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'order-1', ...data })),
    },
    orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
  };
}

beforeEach(() => {
  mockDb.$transaction.mockReset();
  mockDb.$transaction.mockImplementation(async (fn: any) => fn(undefined));
});

describe('Checkout: el precio SIEMPRE se recalcula server-side', () => {
  it('OrderItem guarda exactamente el precio resuelto por el motor (perfil con override)', async () => {
    const tx = makeTx({
      profile: { id: 'prof-1', code: 'VIP', name: 'VIP', percentAdjustment: null, isActive: true },
      productOverrides: [{ productId: 'p1', wholesalePrice: 4200, price: null }],
    });
    mockDb.$transaction.mockImplementation(async (fn: any) => fn(tx));

    const { order } = await processCheckout(
      {
        name: 'Cliente VIP',
        phone: '3001234567',
        email: 'vip@cliente.com',
        items: [{ productId: 'p1', quantity: 5 }],
        cityId: null,
        cartId: 'cart-1',
      },
      { sessionUser: { id: 'cust-1', role: 'CUSTOMER' } }
    );

    // El precio del perfil (4200), NO el base (5000) ni nada enviado por navegador
    expect(order.items.create[0].unitPrice).toBe(4200);
    expect(order.subtotal).toBe(4200 * 5);
  });

  it('checkout de INVITADO con email de un cliente VIP => precio BASE (nunca el perfil)', async () => {
    const tx = makeTx({
      // Existe un cliente con perfil para ese email, pero el comprador es invitado
      profile: { id: 'prof-1', code: 'VIP', name: 'VIP', percentAdjustment: -50, isActive: true },
    });
    // upsertCheckoutCustomer encuentra al cliente existente por contacto
    tx.user.findUnique
      .mockResolvedValueOnce(null) // por teléfono
      .mockResolvedValueOnce({
        id: 'cust-vip',
        name: 'Cliente VIP',
        email: 'vip@cliente.com',
        assignedAgentId: 'agent-7',
      });
    mockDb.$transaction.mockImplementation(async (fn: any) => fn(tx));

    const { order } = await processCheckout({
      name: 'Suplantador',
      phone: null,
      email: 'vip@cliente.com',
      items: [{ productId: 'p1', quantity: 2 }],
      cityId: null,
      cartId: 'cart-1',
      // Intento de suplantación: sin sesión, solo contacto
    });

    // Precio base 5000, NO 2500 (perfil -50%)
    expect(order.items.create[0].unitPrice).toBe(5000);
    expect(order.subtotal).toBe(10000);
  });

  it('pedido de cliente autenticado conserva el asesor asignado en el MAESTRO', async () => {
    const tx = makeTx();
    mockDb.$transaction.mockImplementation(async (fn: any) => fn(tx));

    // resolveOrderCustomer para CUSTOMER autenticado busca su cuenta
    tx.user.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'Cliente fiel',
      isActive: true,
      phone: '3001234567',
      email: null,
      assignedAgentId: 'agent-7',
    });
    tx.user.update.mockResolvedValue({
      id: 'cust-1',
      name: 'Cliente fiel',
      isActive: true,
      assignedAgentId: 'agent-7',
    });

    const { order } = await processCheckout(
      {
        name: 'Cliente fiel',
        phone: '3001234567',
        email: null,
        items: [{ productId: 'p1', quantity: 1 }],
        cityId: null,
        cartId: 'cart-1',
      },
      { sessionUser: { id: 'cust-1', role: 'CUSTOMER' } }
    );

    // agentId del maestro, NO del frontend (el body no incluye agentId)
    expect(order.agentId).toBe('agent-7');
    expect(order.customerId).toBe('cust-1');
  });

  it('subtotal calculado server-side desde los precios resueltos', async () => {
    const tx = makeTx();
    mockDb.$transaction.mockImplementation(async (fn: any) => fn(tx));

    const { order } = await processCheckout({
      name: 'Invitado',
      phone: '3111111111',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 3 },
      ],
      cityId: null,
      cartId: 'cart-1',
    });

    expect(order.subtotal).toBe(5000 * 5);
  });

  it('no existe vía para aceptar unitPrice del cliente en los items', async () => {
    const tx = makeTx();
    const result = await validateAndPriceItems(
      // El navegador "envía" unitPrice 1; la función ni siquiera lo acepta
      [
        { productId: 'p1', quantity: 2 },
        // @ts-expect-error campo extra que el navegador podría mandar
        { productId: 'p1', quantity: 1, unitPrice: 1 },
      ],
      tx
    );
    expect(result.validatedItems).toHaveLength(2);
    for (const item of result.validatedItems) {
      expect(item.unitPrice).toBe(5000);
    }
    expect(result.subtotal).toBe(15000);
  });

  it('stock y sobreventa siguen protegidos con contexto de perfil', async () => {
    const tx = makeTx({
      profile: { id: 'prof-1', code: 'VIP', name: 'VIP', percentAdjustment: null, isActive: true },
    });

    await expect(
      validateAndPriceItems(
        [{ productId: 'p1', quantity: 999 }],
        tx,
        { customerId: 'cust-1' }
      )
    ).rejects.toThrow(CartValidationError);
  });

  it('producto con precio 0 en el perfil => requiere cotización (no comprable)', async () => {
    const tx = makeTx({
      profile: { id: 'prof-1', code: 'COTIZA', name: 'Cotización', percentAdjustment: null, isActive: true },
      productOverrides: [{ productId: 'p1', wholesalePrice: 0, price: null }],
    });

    await expect(
      validateAndPriceItems([{ productId: 'p1', quantity: 1 }], tx, { customerId: 'cust-1' })
    ).rejects.toThrow('requiere cotización');
  });

  it('cliente sin perfil => precio base en el pedido', async () => {
    const tx = makeTx();
    mockDb.$transaction.mockImplementation(async (fn: any) => fn(tx));

    const { order } = await processCheckout({
      name: 'Normal',
      phone: '3122222222',
      items: [{ productId: 'p1', quantity: 1 }],
      cityId: null,
      cartId: 'cart-1',
    });

    expect(order.items.create[0].unitPrice).toBe(5000);
  });
});
