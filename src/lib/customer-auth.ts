import { db } from './db';
import { hashPassword, verifyPassword, createSession, generateToken } from './auth';
import { sendPhoneOtp, verifyPhoneOtp, findCustomerByPhone } from './auth-dual';
import { canonicalColombiaPhone, phoneOrVariants } from './phone';
import { toAuthUserDTO, AuthUserDTO } from './user-dto';

/**
 * Flujos de cuenta del CLIENTE final sobre el maestro `User` (role CUSTOMER):
 * registro, cambio de contraseña y restablecimiento vía OTP (reutiliza la
 * infraestructura Twilio/mock existente; no introduce proveedores nuevos).
 *
 * POLÍTICA DE ACCESO (Fase 2):
 *   - El TELÉFONO es obligatorio en cuentas self-service: es el único canal
 *     de recuperación autónomo actual (OTP por Twilio; no hay proveedor de
 *     email). El correo es dato adicional opcional.
 *   - Todo teléfono se persiste canonicalizado (`src/lib/phone.ts`), de modo
 *     que `3001234567`, `+573001234567` y `573001234567` son LA MISMA cuenta.
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

/**
 * DEPRECATED como formato de almacenamiento: se conserva por compatibilidad
 * con importaciones existentes. Nuevas escrituras usan `canonicalColombiaPhone`.
 */
export function normalizeCustomerPhone(phone?: string | null): string | null {
  return canonicalColombiaPhone(phone);
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
  phone: string | null;
  password: string;
  company?: string | null;
  taxId?: string | null;
}

/**
 * Registra una nueva cuenta CUSTOMER. Nunca reutiliza ni actualiza cuentas
 * existentes: si el email o teléfono ya existen (en cualquiera de sus formas
 * equivalentes), rechaza con error genérico (evita enumeración y secuestro de
 * cuentas creadas por checkout).
 */
export async function registerCustomer(
  input: RegisterCustomerInput,
  sessionDurationHours = 24
): Promise<{ token: string; user: AuthUserDTO }> {
  const name = input.name?.trim().slice(0, 200);
  const email = normalizeCustomerEmail(input.email);
  const phone = canonicalColombiaPhone(input.phone);

  if (!name) {
    throw new CustomerAuthError('INVALID_NAME', 'El nombre es requerido.');
  }
  if (!phone) {
    // Política de fase 2: el teléfono es obligatorio (recuperación por OTP).
    throw new CustomerAuthError(
      'PHONE_REQUIRED',
      'Debes registrar un número de teléfono colombiano de 10 dígitos.'
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CustomerAuthError('INVALID_EMAIL', 'Formato de correo inválido.');
  }
  validatePasswordStrength(input.password);

  const existing = await db.user.findFirst({
    where: {
      role: { equals: 'CUSTOMER', mode: 'insensitive' },
      OR: [...(email ? [{ email }] : []), ...phoneOrVariants(phone)],
    },
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
    user: toAuthUserDTO(user)!,
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

/** Busca el cliente dueño de un contacto (teléfono en cualquier forma / email). */
async function findCustomerByContact(phoneOrEmail: string, tx: any = db) {
  const email = normalizeCustomerEmail(phoneOrEmail);
  const phoneVariants = phoneOrVariants(phoneOrEmail);

  const orConditions = [
    ...(email ? [{ email }] : []),
    ...phoneVariants,
  ];
  if (orConditions.length === 0) return null;

  return (tx ?? db).user.findFirst({
    where: {
      role: { equals: 'CUSTOMER', mode: 'insensitive' },
      OR: orConditions,
    },
    select: { id: true, phone: true, isActive: true },
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
  const phoneVariants = phoneOrVariants(phoneOrEmail);

  if (!email && phoneVariants.length === 0) {
    throw new CustomerAuthError('INVALID_CONTACT', 'Ingresa tu correo o teléfono.');
  }

  const user = await findCustomerByContact(phoneOrEmail);

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
  const phoneVariants = phoneOrVariants(phoneOrEmail);
  const lookupContact = phoneVariants[0] ?? email ?? '';

  const user = await findCustomerByContact(phoneOrEmail);

  // Verificar OTP aunque la cuenta no exista: mismo tiempo de respuesta y
  // validación del proveedor (sin revelar existencia).
  if (!user || !user.isActive || !user.phone) {
    await verifyPhoneOtp(lookupContact, otpCode);
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

// Re-export para flujos administrativos que buscan por teléfono canónico.
export { findCustomerByPhone };
