import { db } from './db';
import { hashPassword, verifyPassword, createSession, generateToken } from './auth';
import { sendPhoneOtp, verifyPhoneOtp } from './auth-dual';

/**
 * Flujos de cuenta del CLIENTE final sobre el maestro `User` (role CUSTOMER):
 * registro, cambio de contraseña y restablecimiento vía OTP (reutiliza la
 * infraestructura Twilio/mock existente; no introduce proveedores nuevos).
 */

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_RESET_SESSION_HOURS = 24;

export class CustomerAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CustomerAuthError';
    this.code = code;
  }
}

export function normalizeCustomerEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

export function normalizeCustomerPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

function validatePasswordStrength(password: string): void {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new CustomerAuthError(
      'WEAK_PASSWORD',
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
  }
  if (password.length > 72) {
    throw new CustomerAuthError(
      'WEAK_PASSWORD',
      'La contraseña no puede exceder 72 caracteres.'
    );
  }
}

export interface RegisterCustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  password: string;
  company?: string | null;
  taxId?: string | null;
}

/**
 * Registra una nueva cuenta CUSTOMER. Nunca reutiliza ni actualiza cuentas
 * existentes: si el email o teléfono ya existen, rechaza con error genérico
 * (evita enumeración y secuestro de cuentas creadas por checkout).
 */
export async function registerCustomer(
  input: RegisterCustomerInput,
  sessionDurationHours = 24
): Promise<{ token: string; user: { id: string; name: string; email: string | null; phone: string | null; role: string } }> {
  const name = input.name?.trim().slice(0, 200);
  const email = normalizeCustomerEmail(input.email);
  const phone = normalizeCustomerPhone(input.phone);

  if (!name) {
    throw new CustomerAuthError('INVALID_NAME', 'El nombre es requerido.');
  }
  if (!email && !phone) {
    throw new CustomerAuthError(
      'CONTACT_REQUIRED',
      'Debes registrar un correo o un número de teléfono.'
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CustomerAuthError('INVALID_EMAIL', 'Formato de correo inválido.');
  }
  validatePasswordStrength(input.password);

  const existing = await db.user.findFirst({
    where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
    select: { id: true },
  });

  if (existing) {
    throw new CustomerAuthError(
      'ACCOUNT_EXISTS',
      'Ya existe una cuenta con estos datos. Inicia sesión o recupera tu contraseña.'
    );
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      role: 'CUSTOMER',
      isActive: true,
      password: await hashPassword(input.password),
      company: input.company?.trim().slice(0, 200) || null,
      taxId: input.taxId?.trim().slice(0, 50) || null,
      passwordChangedAt: new Date(),
    },
  });

  const token = await createSession(user.id, sessionDurationHours);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  };
}

/**
 * Cambio de contraseña con sesión activa. Verifica la contraseña actual y
 * CIERRA todas las demás sesiones del usuario (conserva la actual).
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionToken?: string | null
): Promise<void> {
  validatePasswordStrength(newPassword);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new CustomerAuthError('USER_NOT_FOUND', 'Cuenta no disponible.');
  }
  if (!user.password) {
    throw new CustomerAuthError(
      'NO_PASSWORD',
      'Tu cuenta no tiene contraseña configurada. Usa el acceso por teléfono.'
    );
  }

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    throw new CustomerAuthError('INVALID_CREDENTIALS', 'La contraseña actual es incorrecta.');
  }

  await db.user.update({
    where: { id: userId },
    data: { password: await hashPassword(newPassword), passwordChangedAt: new Date() },
  });

  // Invalidar el resto de sesiones; la sesión actual permanece activa
  await db.session.deleteMany({
    where: {
      userId,
      ...(currentSessionToken ? { token: { not: currentSessionToken } } : {}),
    },
  });
}

/**
 * Solicita restablecimiento de contraseña. Envía un OTP al teléfono del
 * usuario si existe y el proveedor está configurado. La respuesta es
 * genérica para evitar enumeración de cuentas.
 */
export async function requestPasswordReset(
  phoneOrEmail: string
): Promise<{ otpSent: boolean; otpNotConfigured: boolean }> {
  const email = normalizeCustomerEmail(phoneOrEmail);
  const phone = normalizeCustomerPhone(phoneOrEmail);

  if (!email && !phone) {
    throw new CustomerAuthError('INVALID_CONTACT', 'Ingresa tu correo o teléfono.');
  }

  const user = await db.user.findFirst({
    where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
    select: { id: true, phone: true, isActive: true },
  });

  if (!user || !user.isActive || !user.phone) {
    // Respuesta genérica: no revelar si la cuenta existe o tiene teléfono.
    return { otpSent: false, otpNotConfigured: false };
  }

  try {
    await sendPhoneOtp(user.phone);
    return { otpSent: true, otpNotConfigured: false };
  } catch {
    // OTP no configurado u error del proveedor
    return { otpSent: false, otpNotConfigured: true };
  }
}

/**
 * Restablece la contraseña verificando el OTP del teléfono. Al terminar,
 * CIERRA todas las sesiones activas del usuario (el atacante con sesión
 * abierta pierde el acceso y el usuario real vuelve a entrar).
 */
export async function resetPasswordWithOtp(
  phoneOrEmail: string,
  otpCode: string,
  newPassword: string
): Promise<void> {
  validatePasswordStrength(newPassword);

  const email = normalizeCustomerEmail(phoneOrEmail);
  const phone = normalizeCustomerPhone(phoneOrEmail);

  const user = await db.user.findFirst({
    where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
    select: { id: true, phone: true, isActive: true },
  });

  // Verificar OTP aunque la cuenta no exista: mismo tiempo de respuesta y
  // validación del proveedor (sin revelar existencia).
  if (!user || !user.isActive || !user.phone) {
    await verifyPhoneOtp(phone || email || '', otpCode);
    throw new CustomerAuthError('INVALID_CONTACT', 'No fue posible restablecer la contraseña.');
  }

  await verifyPhoneOtp(user.phone, otpCode);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
    },
  });

  await db.session.deleteMany({ where: { userId: user.id } });
}

/** Token opaco de un solo uso para operaciones administrativas futuras. */
export function generateResetToken(): string {
  return generateToken();
}
