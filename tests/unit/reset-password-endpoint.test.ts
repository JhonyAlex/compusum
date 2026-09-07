import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_NEW_PASSWORD } from '../helpers/credentials';

/**
 * ENDPOINT POST /api/auth/reset-password — ANTI-ENUMERACIÓN.
 *
 * La respuesta ante (cuenta inexistente | inactiva | OTP inválido/expirado |
 * proveedor caído) debe ser EXACTAMENTE la misma: mismo status HTTP, misma
 * estructura JSON y mismo mensaje genérico. Nada de mensajes de Twilio ni de
 * canonicalización; ninguna escritura para cuentas desconocidas.
 */

const rlRows = new Map<string, any>();

const mockDb = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  rateLimit: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ db: mockDb }));

vi.mock('@/lib/auth-dual', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-dual')>('@/lib/auth-dual');
  return {
    ...actual,
    // Proveedor OTP simulado: código válido 1234 (como Twilio/mock en dev)
    verifyPhoneOtp: vi.fn().mockImplementation(async (_phone: string, code: string) => {
      if (code !== '1234') throw new Error('Código inválido o expirado');
    }),
    sendPhoneOtp: vi.fn().mockResolvedValue({ provider: 'mock', debugCode: '1234' }),
    isPhoneOtpLoginEnabled: vi.fn().mockReturnValue(true),
  };
});

import { POST as resetPOST } from '@/app/api/auth/reset-password/route';
import { GENERIC_RESET_FAILURE } from '@/lib/customer-auth';
import { verifyPhoneOtp } from '@/lib/auth-dual';

/** Request mínimo suficiente para la ruta. */
function resetReq(body: unknown, ip: string) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }) as any;
}

const EXISTING_USER = {
  id: 'u-existe',
  email: 'existe@test.com',
  phone: '573001234567',
  role: 'CUSTOMER',
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  rlRows.clear();
  mockDb.user.findFirst.mockResolvedValue(null);
  mockDb.rateLimit.findUnique.mockImplementation(async ({ where }: any) => rlRows.get(where.key) ?? null);
  mockDb.rateLimit.upsert.mockImplementation(async ({ where, create, update }: any) => {
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
  });
  mockDb.rateLimit.deleteMany.mockResolvedValue({});
  mockDb.user.update.mockResolvedValue({});
  mockDb.session.deleteMany.mockResolvedValue({});
});

describe('ENDPOINT reset-password: respuesta indistinguible existente vs inexistente', () => {
  it('A (email existente + OTP incorrecto) y B (email inexistente + cualquier OTP) => MISMA respuesta', async () => {
    // A: la cuenta EXISTE (con teléfono) pero el OTP es incorrecto
    mockDb.user.findFirst.mockResolvedValue({ ...EXISTING_USER });
    const resA = await resetPOST(
      resetReq(
        { phoneOrEmail: 'existe@test.com', otpCode: '9999', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.1'
      )
    );
    const jsonA = await resA.json();

    // B: la cuenta NO existe; el OTP podría ser válido o no: da igual
    mockDb.user.findFirst.mockResolvedValue(null);
    const resB = await resetPOST(
      resetReq(
        { phoneOrEmail: 'noexiste@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.2'
      )
    );
    const jsonB = await resB.json();

    // Mismo status HTTP y MISMO body (comparación completa, no solo un campo)
    expect(resA.status).toBe(400);
    expect(resB.status).toBe(400);
    expect(jsonA).toEqual(jsonB);

    // Mensaje EXACTAMENTE el genérico (sin filtrar detalle técnico/proveedor)
    expect(jsonA).toEqual({ success: false, error: GENERIC_RESET_FAILURE });
  });

  it('B no crea usuarios, no modifica usuarios ni toca sesiones', async () => {
    mockDb.user.findFirst.mockResolvedValue(null);

    await resetPOST(
      resetReq(
        { phoneOrEmail: 'fantasma@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.3'
      )
    );

    expect(mockDb.user.create).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockDb.session.deleteMany).not.toHaveBeenCalled();
  });

  it('cuenta inactiva => misma respuesta genérica que inexistente', async () => {
    const baseline = await (async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      const res = await resetPOST(
        resetReq(
          { phoneOrEmail: 'nadie@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
          '10.20.0.4'
        )
      );
      return { status: res.status, json: await res.json() };
    })();

    mockDb.user.findFirst.mockResolvedValue({ ...EXISTING_USER, isActive: false });
    const res = await resetPOST(
      resetReq(
        { phoneOrEmail: 'inactiva@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.5'
      )
    );

    expect(res.status).toBe(baseline.status);
    expect(await res.json()).toEqual(baseline.json);
  });

  it('fallo del proveedor (Twilio) => mismo mensaje genérico, sin propagar detalle', async () => {
    mockDb.user.findFirst.mockResolvedValue({ ...EXISTING_USER });
    (verifyPhoneOtp as any).mockRejectedValueOnce(
      new Error('Twilio: unable to create record (cod: 60200)')
    );

    const res = await resetPOST(
      resetReq(
        { phoneOrEmail: 'existe@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.6'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ success: false, error: GENERIC_RESET_FAILURE });
    expect(JSON.stringify(json)).not.toContain('Twilio');
  });

  it('identificador con formato absurdo => misma respuesta genérica (sin error de canonicalización)', async () => {
    mockDb.user.findFirst.mockResolvedValue(null);

    const res = await resetPOST(
      resetReq(
        { phoneOrEmail: 'esto-no-es-nada!!', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.7'
      )
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: GENERIC_RESET_FAILURE });
  });

  it('flujo feliz intacto: OTP correcto => 200, cambia contraseña y cierra sesiones', async () => {
    mockDb.user.findFirst.mockResolvedValue({ ...EXISTING_USER });

    const res = await resetPOST(
      resetReq(
        { phoneOrEmail: 'existe@test.com', otpCode: '1234', newPassword: TEST_NEW_PASSWORD },
        '10.20.0.8'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-existe' },
        data: expect.objectContaining({ passwordChangedAt: expect.any(Date) }),
      })
    );
    expect(mockDb.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u-existe' } });
  });
});
