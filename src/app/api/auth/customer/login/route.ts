import { NextResponse } from 'next/server';
import { loginWithPhone, loginWithPassword } from '@/lib/auth-dual';
import { setSessionCookie } from '@/lib/auth';

type LoginMethod = 'phone' | 'password';

type AttemptEntry = {
  count: number;
  firstAttemptAt: number;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

const globalForRateLimit = globalThis as typeof globalThis & {
  __customerLoginAttempts?: Map<string, AttemptEntry>;
};

const attemptStore = globalForRateLimit.__customerLoginAttempts ?? new Map<string, AttemptEntry>();
globalForRateLimit.__customerLoginAttempts = attemptStore;

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const candidate = forwardedFor || realIp || 'unknown';
  return `ip:${candidate}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attemptStore.get(key);

  if (!current) {
    attemptStore.set(key, { count: 1, firstAttemptAt: now });
    return false;
  }

  if (now - current.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    attemptStore.set(key, { count: 1, firstAttemptAt: now });
    return false;
  }

  current.count += 1;
  attemptStore.set(key, current);
  return current.count > RATE_LIMIT_MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  try {
    const key = getClientKey(req);
    if (isRateLimited(key)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const method = (body.method as LoginMethod) || 'phone';

    if (method === 'phone' && process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_PHONE_OTP !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Inicio de sesión por OTP no disponible temporalmente.' },
        { status: 503 }
      );
    }

    if (method === 'phone') {
      const { phone, otpCode } = body;
      if (!phone || !otpCode) {
        return NextResponse.json(
          { success: false, error: 'Phone y OTP son requeridos' },
          { status: 400 }
        );
      }

      const result = await loginWithPhone(phone, otpCode);
      await setSessionCookie(result.token);

      return NextResponse.json({
        success: true,
        data: { user: result.user },
      });
    }

    const { phoneOrEmail, password } = body;
    if (!phoneOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Teléfono/email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const result = await loginWithPassword(phoneOrEmail, password);
    await setSessionCookie(result.token);

    return NextResponse.json({
      success: true,
      data: { user: result.user },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'No fue posible iniciar sesión' },
      { status: 401 }
    );
  }
}
