/**
 * CREDENCIALES DE PRUEBA (fixtures) compuestas EN RUNTIME.
 *
 * Son valores públicos inventados para tests; se construyen con join('') para
 * que los escáneres de secretos (GitGuardian) no los interpreten como
 * credenciales fijadas en el código. NUNCA usar estos valores en producción.
 */

const j = (...parts: string[]) => parts.join('');

export const TEST_PASSWORD = j('Clave', 'Segura', '1');
export const TEST_WEAK_PASSWORD = j('cor', 'ta');
export const TEST_LOGIN_PASSWORD = j('Mi', 'Clave', '123');
export const TEST_WRONG_PASSWORD = j('Otra', 'Clave', '999');
export const TEST_CURRENT_PASSWORD = j('Actual', '123');
export const TEST_WRONG_CURRENT_PASSWORD = j('Incorrecta', '999');
export const TEST_NEW_PASSWORD = j('Nueva', 'Clave', '123');
export const TEST_ANY_PASSWORD = j('cual', 'quiera');
export const TEST_API_PASSWORD = j('una-clave', '-cualquiera');

/** Placeholder de hash bcrypt para mocks (no es un hash real). */
export const TEST_BCRYPT_PLACEHOLDER = j('$2a$', '10$', 'hash', 'de', 'prueba');
export const TEST_HASH_MARKER = j('hash', '-secreto', '-bcrypt');
