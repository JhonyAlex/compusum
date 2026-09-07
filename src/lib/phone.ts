/**
 * CANONICALIZACIÓN ÚNICA DE TELÉFONOS (Colombia).
 *
 * DECISIÓN DE FORMATO CANÓNICO EN BASE DE DATOS:
 *   `57` + número local de 10 dígitos => 12 dígitos, SIN `+`.
 *   Ejemplos: móvil `573001234567`, fijo `576063335206`.
 *
 * Motivos:
 *   - El formato sin `+` ya era el de-facto de las cuentas creadas por OTP
 *     (`loginWithPhone` almacenaba `573001234567`); adoptarlo minimiza la
 *     migración de datos existentes.
 *   - Es inequívoco: un número local de 10 dígitos (`3001234567`) y su
 *     equivalente con indicativo (`+573001234567`, `573001234567`) canonicalizan
 *     al MISMO valor, evitando usuarios duplicados para el mismo cliente.
 *
 * Compatibilidad con datos existentes:
 *   - `phoneStorageVariants()` devuelve el canónico Y la forma legada local
 *     (10 dígitos) para que las búsquedas de contacto sigan encontrando
 *     cuentas registradas antes de la canonicalización (la migración de
 *     backfill salta filas colisionantes; ver migración de teléfono).
 *   - NO fusiona usuarios: si existen dos cuentas equivalentes, la búsqueda
 *     determinista devuelve SIEMPRE la misma (canónico primero).
 */

const COUNTRY_CODE = '57';
const LOCAL_LENGTH = 10;
const CANONICAL_LENGTH = COUNTRY_CODE.length + LOCAL_LENGTH; // 12

/**
 * Canonicaliza un teléfono colombiano a `57XXXXXXXXXX` (12 dígitos).
 * Acepta `3001234567`, `+573001234567`, `573001234567`, `(300) 123-4567`,
 * `00573001234567`, etc. Devuelve null si el input no representa un número
 * colombiano reconocible: el número local de 10 dígitos debe ser móvil
 * (empieza por 3) o fijo moderno (empieza por 60). Números extranjeros o
 * históricos inválidos se rechazan en lugar de manglearse.
 */
export function canonicalColombiaPhone(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;

  let digits = input.replace(/\D/g, '');
  if (!digits) return null;

  // Prefijo internacional 00 (Colombia marca 00 antes del código de país)
  if (digits.startsWith('0057')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Ya canónico: 57 + 10 dígitos locales (móvil 3.., fijo 60..)
  const localPart = digits.startsWith(COUNTRY_CODE)
    ? digits.slice(COUNTRY_CODE.length)
    : null;
  if (localPart && digits.length === CANONICAL_LENGTH && isColombiaLocalNumber(localPart)) {
    return digits;
  }

  // Número local de 10 dígitos => anteponer indicativo
  if (digits.length === LOCAL_LENGTH && isColombiaLocalNumber(digits)) {
    return `${COUNTRY_CODE}${digits}`;
  }

  return null;
}

/** Móvil (3XXXXXXXXX) o fijo moderno (60XXXXXXX) de 10 dígitos. */
function isColombiaLocalNumber(localDigits: string): boolean {
  return localDigits.length === LOCAL_LENGTH && (localDigits.startsWith('3') || localDigits.startsWith('60'));
}

/** Formato E.164 (con `+`) para proveedores externos como Twilio Verify. */
export function toE164ColombiaPhone(input?: string | null): string | null {
  const canonical = canonicalColombiaPhone(input);
  return canonical ? `+${canonical}` : null;
}

/**
 * Formas de almacenamiento bajo las que una misma línea puede estar guardada:
 * el formato canónico y la forma legada local de 10 dígitos (datos previos a
 * la canonicalización o filas colisionantes que la migración no tocó).
 * Orden determinista: canónico primero.
 */
export function phoneStorageVariants(input?: string | null): string[] {
  const canonical = canonicalColombiaPhone(input);
  if (!canonical) return [];
  const variants = [canonical];
  const local = canonical.slice(COUNTRY_CODE.length);
  if (local !== canonical) variants.push(local);
  return variants;
}

/** Condición Prisma OR para buscar un usuario por teléfono en cualquier forma almacenada. */
export function phoneOrVariants(input?: string | null): Array<{ phone: string }> {
  return phoneStorageVariants(input).map((phone) => ({ phone }));
}

/**
 * Clave estable de identidad telefónica para rate limiting / deduplicación.
 * Dos entradas equivalentes producen la misma clave.
 */
export function phoneIdentityKey(input?: string | null): string | null {
  return canonicalColombiaPhone(input);
}
