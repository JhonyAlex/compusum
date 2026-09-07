import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, CustomerAuthError } from '@/lib/customer-auth';
import { isPhoneOtpLoginEnabled } from '@/lib/auth-dual';
import { checkRateLimit, recordFailedAttempt, getClientIp } from '@/lib/rate-limit';

const FORGOT_MAX_ATTEMPTS = 5;
const FORGOT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_LOCKOUT_MS = 30 * 60 * 1000;

/**
 * Solicita restablecimiento de contraseña. La respuesta es SIEMPRE genérica
 * (no revela si la cuenta existe). El reset se completa en /api/auth/reset-password
 * con el OTP recibido por teléfono (Twilio Verify o mock de desarrollo).
 */
export async function POST(req: NextRequest) {
  try {
    const ipKey = `forgot-password:ip:${getClientIp(req)}`;
    const limit = await checkRateLimit(ipKey, FORGOT_MAX_ATTEMPTS, FORGOT_WINDOW_MS);
    if (limit.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
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

    const body = await req.json();
    const { phoneOrEmail } = body ?? {};
    const identifierKey = phoneOrEmail
      ? `forgot-password:id:${String(phoneOrEmail).trim().toLowerCase().slice(0, 120)}`
      : null;

    try {
      await requestPasswordReset(phoneOrEmail);
    } catch (error) {
      if (error instanceof CustomerAuthError) {
        await recordFailedAttempt(ipKey, FORGOT_MAX_ATTEMPTS, FORGOT_WINDOW_MS, FORGOT_LOCKOUT_MS);
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: 400 }
        );
      }
      throw error;
    }

    if (identifierKey) {
      await recordFailedAttempt(identifierKey, FORGOT_MAX_ATTEMPTS * 4, FORGOT_WINDOW_MS, FORGOT_LOCKOUT_MS);
    }

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
