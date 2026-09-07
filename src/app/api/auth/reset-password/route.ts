import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp, CustomerAuthError } from '@/lib/customer-auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';

const RESET_MAX_ATTEMPTS = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_LOCKOUT_MS = 30 * 60 * 1000;

/**
 * Completa el restablecimiento de contraseña verificando el OTP enviado al
 * teléfono. Al terminar se CIERRAN todas las sesiones del usuario.
 */
export async function POST(req: NextRequest) {
  try {
    const ipKey = `reset-password:ip:${getClientIp(req)}`;
    const limit = await checkRateLimit(ipKey, RESET_MAX_ATTEMPTS, RESET_WINDOW_MS);
    if (limit.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demasiados intentos. Solicita un nuevo código en unos minutos.',
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { phoneOrEmail, otpCode, newPassword } = body ?? {};

    if (!phoneOrEmail || !otpCode || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Teléfono/correo, código y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    try {
      await resetPasswordWithOtp(phoneOrEmail, otpCode, newPassword);
      await resetRateLimit(ipKey);

      return NextResponse.json({
        success: true,
        message: 'Contraseña restablecida. Ya puedes iniciar sesión.',
      });
    } catch (error) {
      if (error instanceof CustomerAuthError) {
        await recordFailedAttempt(ipKey, RESET_MAX_ATTEMPTS, RESET_WINDOW_MS, RESET_LOCKOUT_MS);
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.code === 'INVALID_CONTACT' ? 400 : 400 }
        );
      }
      // Errores de OTP del proveedor (código inválido/expirado)
      const message = error instanceof Error ? error.message : 'Código inválido o expirado';
      await recordFailedAttempt(ipKey, RESET_MAX_ATTEMPTS, RESET_WINDOW_MS, RESET_LOCKOUT_MS);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible restablecer la contraseña' },
      { status: 500 }
    );
  }
}
