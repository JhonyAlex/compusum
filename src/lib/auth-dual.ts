import { db } from './db';
import { hashPassword, verifyPassword, createSession } from './auth';

function generateTemporaryPassword(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizePhoneInput(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function loginWithPhone(phone: string, otpCode: string): Promise<{ token: string; user: any }> {
  const normalizedPhone = normalizePhoneInput(phone);
  const isMockOtpEnabled = process.env.ENABLE_MOCK_PHONE_OTP === 'true';

  // Temporary safeguard: block mock OTP in production unless explicitly enabled.
  if (process.env.NODE_ENV === 'production' && !isMockOtpEnabled) {
    throw new Error('Inicio de sesión por OTP temporalmente deshabilitado. Contacta soporte.');
  }

  const expectedOtp = process.env.MOCK_PHONE_OTP || '123456';
  const isValidOTP = otpCode === expectedOtp;
  if (!isValidOTP) throw new Error("Código inválido");

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

  const token = await createSession(user.id);
  return { token, user };
}

export async function loginWithPassword(phoneOrEmail: string, passwordPlain: string): Promise<{ token: string; user: any }> {
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

  const token = await createSession(user.id);
  return { token, user };
}
