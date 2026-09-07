import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { changePassword, CustomerAuthError } from '@/lib/customer-auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';

const CHANGE_MAX_ATTEMPTS = 5;
const CHANGE_WINDOW_MS = 15 * 60 * 1000;
const CHANGE_LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const ipKey = `change-password:ip:${getClientIp(req)}`;
    const limit = await checkRateLimit(ipKey, CHANGE_MAX_ATTEMPTS, CHANGE_WINDOW_MS);
    if (limit.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body ?? {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Contraseña actual y nueva son requeridas' },
        { status: 400 }
      );
    }

    try {
      const sessionToken = req.cookies.get('session_token')?.value ?? null;

      await changePassword(user.id, currentPassword, newPassword, sessionToken);
      await resetRateLimit(ipKey);

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada. Las demás sesiones fueron cerradas.',
      });
    } catch (error) {
      if (error instanceof CustomerAuthError) {
        await recordFailedAttempt(ipKey, CHANGE_MAX_ATTEMPTS, CHANGE_WINDOW_MS, CHANGE_LOCKOUT_MS);
        const status = error.code === 'INVALID_CREDENTIALS' ? 401 : 400;
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'No fue posible cambiar la contraseña' },
      { status: 500 }
    );
  }
}
