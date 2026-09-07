import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * RATE LIMITING PERSISTENTE (tabla RateLimit + fallback memoria).
 * Usado por login de clientes, admin login, registro y recuperación.
 */

const mockDb = vi.hoisted(() => ({
  rateLimit: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/db', () => ({ db: mockDb }));

import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  ADMIN_LOGIN_MAX_ATTEMPTS,
} from '@/lib/rate-limit';

const KEY = 'test:key';

beforeEach(() => {
  vi.clearAllMocks();
  // Simula persistencia real en la tabla RateLimit entre llamadas
  let saved: any = null;
  mockDb.rateLimit.findUnique.mockImplementation(() => Promise.resolve(saved));
  mockDb.rateLimit.upsert.mockImplementation(({ create }: any) => {
    saved = { ...create };
    return Promise.resolve(saved);
  });
});

describe('Rate limit persistente', () => {
  it('sin registro previo => no bloqueado', async () => {
    const result = await checkRateLimit(KEY);
    expect(result.isBlocked).toBe(false);
    expect(result.remainingAttempts).toBe(ADMIN_LOGIN_MAX_ATTEMPTS);
  });

  it('bloquea al alcanzar el máximo de intentos y persiste en BD', async () => {
    let result;
    for (let i = 0; i < ADMIN_LOGIN_MAX_ATTEMPTS; i++) {
      result = await recordFailedAttempt(`${KEY}-max`);
    }
    expect(result!.isBlocked).toBe(true);
    expect(result!.blockedUntil).toBeDefined();
    expect(mockDb.rateLimit.upsert).toHaveBeenCalledTimes(ADMIN_LOGIN_MAX_ATTEMPTS);

    const check = await checkRateLimit(`${KEY}-max`);
    expect(check.isBlocked).toBe(true);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reinicia el contador tras un login exitoso', async () => {
    for (let i = 0; i < ADMIN_LOGIN_MAX_ATTEMPTS - 1; i++) {
      await recordFailedAttempt(`${KEY}-reset`);
    }
    await resetRateLimit(`${KEY}-reset`);
    expect(mockDb.rateLimit.deleteMany).toHaveBeenCalledWith({ where: { key: `${KEY}-reset` } });

    const check = await checkRateLimit(`${KEY}-reset`);
    expect(check.isBlocked).toBe(false);
  });

  it('respeta la ventana: intentos fuera de ventana no bloquean', async () => {
    const oldDate = new Date(Date.now() - 30 * 60 * 1000); // fuera de la ventana de 15 min
    mockDb.rateLimit.findUnique.mockResolvedValue({
      key: KEY,
      attempts: ADMIN_LOGIN_MAX_ATTEMPTS,
      firstAttempt: oldDate,
      blockedUntil: null,
    });

    const check = await checkRateLimit(KEY);
    expect(check.isBlocked).toBe(false);
  });
});
