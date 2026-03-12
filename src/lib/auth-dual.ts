import { db } from './db';
import { hashPassword, verifyPassword, createSession } from './auth';

export async function loginWithPhone(phone: string, otpCode: string): Promise<{ token: string; user: any }> {
  // Real implementation must verify the OTP via a provider like Twilio/WhatsApp API here.
  // For this mock/demo, we assume an OTP of "123456" is valid, any other is invalid.
  const isValidOTP = otpCode === "123456";
  if (!isValidOTP) throw new Error("Código inválido");

  let user = await db.user.findUnique({ where: { phone } });

  if (!user) {
    user = await db.user.create({
      data: {
        phone,
        name: 'Nuevo Cliente',
        password: await hashPassword(Math.random().toString(36).slice(-8)), // random mock password
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
