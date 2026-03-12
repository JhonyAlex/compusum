import { NextResponse } from 'next/server';
import { loginWithPhone } from '@/lib/auth-dual';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_PHONE_OTP !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Inicio de sesión por OTP no disponible temporalmente.' },
        { status: 503 }
      );
    }

    const { phone, otpCode } = await req.json();

    if (!phone || !otpCode) {
      return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
    }

    const result = await loginWithPhone(phone, otpCode);
    await setSessionCookie(result.token);

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
