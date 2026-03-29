import { db } from './db';
import { hashPassword, verifyPassword, createSession } from './auth';
import { checkOtpWithTwilio, isTwilioVerifyConfigured, sendOtpWithTwilio } from './twilio-verify';

function generateTemporaryPassword(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizePhoneInput(phone: string): string {
  return phone.replace(/\D/g, '');
}

function toE164Phone(phone: string): string {
  const digits = normalizePhoneInput(phone);

  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }

  // Default Colombia country code for local 10-digit input.
  if (digits.length === 10) {
    return `+57${digits}`;
  }

  return `+${digits}`;
}

function isMockOtpEnabled(): boolean {
  return process.env.ENABLE_MOCK_PHONE_OTP === 'true';
}

export function isPhoneOtpLoginEnabled(): boolean {
  return isMockOtpEnabled() || isTwilioVerifyConfigured();
}

export async function sendPhoneOtp(phone: string): Promise<{ provider: 'twilio' | 'mock'; debugCode?: string }> {
  const e164Phone = toE164Phone(phone);

  if (isMockOtpEnabled()) {
    return {
      provider: 'mock',
      debugCode: process.env.MOCK_PHONE_OTP || '123456',
    };
  }

  if (!isTwilioVerifyConfigured()) {
    throw new Error('OTP no configurado. Define Twilio o habilita ENABLE_MOCK_PHONE_OTP en desarrollo.');
  }

  await sendOtpWithTwilio(e164Phone);
  return { provider: 'twilio' };
}

export async function loginWithPhone(
  phone: string,
  otpCode: string,
  sessionDurationHours = 24
): Promise<{ token: string; user: any }> {
  const e164Phone = toE164Phone(phone);
  const normalizedPhone = normalizePhoneInput(e164Phone);

  if (isMockOtpEnabled()) {
    const expectedOtp = process.env.MOCK_PHONE_OTP || '123456';
    const isValidMockOtp = otpCode === expectedOtp;
    if (!isValidMockOtp) throw new Error('Código inválido');
  } else {
    if (!isTwilioVerifyConfigured()) {
      throw new Error('OTP no configurado. Define credenciales de Twilio Verify.');
    }

    const isValidTwilioOtp = await checkOtpWithTwilio(e164Phone, otpCode);
    if (!isValidTwilioOtp) throw new Error('Código inválido o expirado');
  }

  let user = await db.user.findUnique({ where: { phone: normalizedPhone } });

  if (!user) {
    user = await db.user.create({
      data: {
        phone: normalizedPhone,
        name: 'Nuevo Cliente',
        password: await hashPassword(generateTemporaryPassword()),
      }
    });
  }

  const token = await createSession(user.id, sessionDurationHours);
  return { token, user };
}

export async function loginWithPassword(
  phoneOrEmail: string,
  passwordPlain: string,
  sessionDurationHours = 24
): Promise<{ token: string; user: any }> {
  const user = await db.user.findFirst({
    where: {
      OR: [
        { phone: phoneOrEmail },
        { email: phoneOrEmail }
      ]
    }
  });

  if (!user || !user.password) {
    throw new Error("Usa tu número de teléfono para ingresar o configura una contraseña.");
  }

  const isValid = await verifyPassword(passwordPlain, user.password);
  if (!isValid) throw new Error("Credenciales inválidas");

  const token = await createSession(user.id, sessionDurationHours);
  return { token, user };
}
