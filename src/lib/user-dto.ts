/**
 * DTO ÚNICO DE USUARIO AUTENTICADO PARA RESPUESTAS DEL NAVEGADOR.
 *
 * Toda ruta de auth/registro/perfil que devuelva un `User` debe pasar por
 * aquí. NUNCA se exponen: hash de contraseña, `passwordChangedAt`, tokens,
 * sesiones, relaciones internas ni campos de auditoría administrativa.
 */

/** Campos públicos permitidos en respuestas de autenticación. */
const AUTH_USER_PUBLIC_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'role',
  'company',
  'taxId',
  'city',
  'isActive',
] as const;

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  company: string | null;
  taxId: string | null;
  city: string | null;
  isActive: boolean;
}

/**
 * Proyecta un registro Prisma `User` (posiblemente con relaciones) a su
 * versión pública. Ignora cualquier campo no listado, incluso si el select
 * del caller los incluyó.
 */
export function toAuthUserDTO(user: unknown): AuthUserDTO | null {
  if (!user || typeof user !== 'object' || !('id' in user)) return null;

  const record = user as Record<string, any>;
  const dto: Record<string, unknown> = {};
  for (const field of AUTH_USER_PUBLIC_FIELDS) {
    if (record[field] !== undefined) dto[field] = record[field];
  }
  return dto as unknown as AuthUserDTO;
}

/**
 * Igual que `toAuthUserDTO` pero lanza si el usuario no es válido: para rutas
 * de login donde un usuario sin id es un error de programación, no un estado
 * serializable.
 */
export function requireAuthUserDTO(user: Record<string, any> | null | undefined): AuthUserDTO {
  const dto = toAuthUserDTO(user);
  if (!dto) throw new Error('Usuario autenticado inválido');
  return dto;
}
