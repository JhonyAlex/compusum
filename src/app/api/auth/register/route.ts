import { NextRequest, NextResponse } from 'next/server';
import { registerCustomer, CustomerAuthError } from '@/lib/customer-auth';
import { setSessionCookie, SESSION_DURATION_HOURS_DEFAULT } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';

const REGISTER_MAX_ATTEMPTS = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const REGISTER_LOCKOUT_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ipKey = `register:ip:${getClientIp(req)}`;

    const limit = await checkRateLimit(ipKey, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS);
    if (limit.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demasiados intentos de registro. Intenta más tarde.',
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password, company, taxId } = body ?? {};

    try {
      const result = await registerCustomer({ name, email, phone, password, company, taxId });

      await resetRateLimit(ipKey);
      await setSessionCookie(result.token, SESSION_DURATION_HOURS_DEFAULT * 60 * 60);

      return NextResponse.json({
        success: true,
        data: { user: result.user },
        message: 'Cuenta creada exitosamente',
      });
    } catch (error) {
      if (error instanceof CustomerAuthError) {
        await recordFailedAttempt(ipKey, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS, REGISTER_LOCKOUT_MS);
        const status = error.code === 'ACCOUNT_EXISTS' ? 409 : 400;
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible crear la cuenta' },
      { status: 500 }
    );
  }
}
