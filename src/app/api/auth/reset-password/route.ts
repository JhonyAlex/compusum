import { NextRequest, NextResponse } from 'next/server';
import {
  resetPasswordWithOtp,
  CustomerAuthError,
  GENERIC_RESET_FAILURE,
} from '@/lib/customer-auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';

const RESET_MAX_ATTEMPTS = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_LOCKOUT_MS = 30 * 60 * 1000;

/**
 * Completa el restablecimiento de contraseña verificando el OTP enviado al
 * teléfono. Al terminar se CIERRAN todas las sesiones del usuario.
 *
 * ANTI-ENUMERACIÓN: todos los fallos de verificación (cuenta inexistente,
 * inactiva, OTP inválido/expirado, proveedor no disponible) devuelven EXACTAMENTE
 * la misma respuesta (status 400 + GENERIC_RESET_FAILURE). La contraseña débil
 * es un error de FORMA del request: ocurre antes de tocar la base de datos, así
 * que su mensaje específico no revela nada sobre la existencia de cuentas.
 * Los mensajes de Twilio o de canonicalización NUNCA llegan al cliente.
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
      if (error instanceof CustomerAuthError && error.code === 'WEAK_PASSWORD') {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: 400 }
        );
      }

      // Todo lo demás es INDISTINGUIBLE entre sí: mismo status y mismo mensaje.
      // El detalle real (proveedor, cuenta inexistente, OTP) solo en log server-side.
      console.warn(
        '[RESET_PASSWORD] Restablecimiento rechazado (respuesta genérica):',
        error instanceof Error ? `${error.name}: ${error.message}` : error
      );
      await recordFailedAttempt(ipKey, RESET_MAX_ATTEMPTS, RESET_WINDOW_MS, RESET_LOCKOUT_MS);
      return NextResponse.json({ success: false, error: GENERIC_RESET_FAILURE }, { status: 400 });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible restablecer la contraseña' },
      { status: 500 }
    );
  }
}
