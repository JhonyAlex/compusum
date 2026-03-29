import { NextResponse } from 'next/server';
import { isPhoneOtpLoginEnabled, loginWithPhone } from '@/lib/auth-dual';
import { setSessionCookie } from '@/lib/auth';
import { transferSessionCartToUser, transferSessionOrderToUser } from '@/lib/order-cart-upsert';

export async function POST(req: Request) {
  try {
    if (!isPhoneOtpLoginEnabled()) {
      return NextResponse.json(
        { success: false, error: 'Inicio de sesión por OTP no disponible. Configura Twilio Verify.' },
        { status: 503 }
      );
    }

    const { phone, otpCode } = await req.json();

    if (!phone || !otpCode) {
      return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
    }

    const result = await loginWithPhone(phone, otpCode);
    await setSessionCookie(result.token);

    // Transferir carrito y pedidos de la sesión de invitado al usuario
    const sessionId = req.headers.get('x-session-id');
    if (sessionId && result.user?.id) {
      await Promise.all([
        transferSessionCartToUser(sessionId, result.user.id),
        transferSessionOrderToUser(sessionId, result.user.id),
      ]).catch((e) => console.error('Error transfiriendo sesión al usuario:', e));
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
