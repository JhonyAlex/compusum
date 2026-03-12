import { NextResponse } from 'next/server';
import { loginWithPhone } from '@/lib/auth-dual';

export async function POST(req: Request) {
  try {
    const { phone, otpCode } = await req.json();

    if (!phone || !otpCode) {
      return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
    }

    const result = await loginWithPhone(phone, otpCode);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
