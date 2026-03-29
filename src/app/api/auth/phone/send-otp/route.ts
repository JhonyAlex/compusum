import { NextResponse } from 'next/server';
import { isPhoneOtpLoginEnabled, sendPhoneOtp } from '@/lib/auth-dual';

export async function POST(req: Request) {
  try {
    if (!isPhoneOtpLoginEnabled()) {
      return NextResponse.json(
        { success: false, error: 'Servicio OTP no disponible. Configura Twilio Verify.' },
        { status: 503 }
      );
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });
    }

    const result = await sendPhoneOtp(phone);

    return NextResponse.json({
      success: true,
      data: {
        provider: result.provider,
        ...(process.env.NODE_ENV !== 'production' && result.debugCode ? { debugCode: result.debugCode } : {}),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'No fue posible enviar el OTP' },
      { status: 400 }
    );
  }
}
