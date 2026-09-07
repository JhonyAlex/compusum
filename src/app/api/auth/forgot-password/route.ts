import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, CustomerAuthError } from '@/lib/customer-auth';
import { isPhoneOtpLoginEnabled } from '@/lib/auth-dual';
import {
  checkRateLimit,
  recordFailedAttempt,
  getClientIp,
  FORGOT_IP_MAX_ATTEMPTS,
  FORGOT_ID_MAX_ATTEMPTS,
  FORGOT_WINDOW_MS,
  FORGOT_LOCKOUT_MS,
} from '@/lib/rate-limit';
import { canonicalColombiaPhone } from '@/lib/phone';

/**
 * Solicitud de restablecimiento de contraseña. La respuesta es SIEMPRE genérica
 * (no revela si la cuenta existe). El reset se completa en /api/auth/reset-password
 * con el OTP recibido por teléfono (Twilio Verify o mock de desarrollo).
 *
 * Rate limit en DOS capas reales (checkRateLimit + recordFailedAttempt): por IP
 * y por identidad normalizada (teléfono canónico o email). Canonicalizar el
 * teléfono hace que `3001234567` y `+573001234567` consuman la MISMA
 * identidad: rotar IP o reescribir el número no evita el límite.
 */
export async function POST(req: NextRequest) {
  try {
    const ipKey = `forgot-password:ip:${getClientIp(req)}`;

    const body = await req.json().catch(() => ({}));
    const { phoneOrEmail } = body ?? {};

    let identifierKey: string | null = null;
    if (phoneOrEmail) {
      const raw = String(phoneOrEmail);
      const phoneKey = canonicalColombiaPhone(raw);
      const identity = phoneKey ?? raw.trim().toLowerCase().slice(0, 120);
      identifierKey = `forgot-password:id:${identity}`;
    }

    // Verificar AMBAS capas ANTES de procesar nada. Cada cubeta usa EXACTAMENTE
    // el mismo máximo/ventana/lockout en check y en record (constantes únicas).
    for (const [key, maxAttempts] of [
      [ipKey, FORGOT_IP_MAX_ATTEMPTS],
      ...(identifierKey ? [[identifierKey, FORGOT_ID_MAX_ATTEMPTS] as const] : []),
    ] as const) {
      const limit = await checkRateLimit(key, maxAttempts, FORGOT_WINDOW_MS);
      if (limit.isBlocked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Demasiados intentos. Intenta más tarde.',
            retryAfterSeconds: limit.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
    }

    if (!isPhoneOtpLoginEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'El restablecimiento por teléfono no está disponible en este momento. Contacta a tu asesor para restablecer tu contraseña.',
          code: 'OTP_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const recordAttempts = () =>
      Promise.all([
        recordFailedAttempt(ipKey, FORGOT_IP_MAX_ATTEMPTS, FORGOT_WINDOW_MS, FORGOT_LOCKOUT_MS),
        ...(identifierKey
          ? [
              recordFailedAttempt(
                identifierKey,
                FORGOT_ID_MAX_ATTEMPTS,
                FORGOT_WINDOW_MS,
                FORGOT_LOCKOUT_MS
              ),
            ]
          : []),
      ]);

    try {
      await requestPasswordReset(phoneOrEmail);
    } catch (error) {
      if (error instanceof CustomerAuthError) {
        await recordAttempts();
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: 400 }
        );
      }
      throw error;
    }

    // Solicitud válida (con o sin cuenta asociada): consume intento en ambas
    // capas para impedir provisionar OTP masivamente.
    await recordAttempts();

    return NextResponse.json({
      success: true,
      message:
        'Si tu cuenta tiene un teléfono registrado, recibirás un código para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible procesar la solicitud' },
      { status: 500 }
    );
  }
}
