import { describe, it, expect } from 'vitest';
import {
  canonicalColombiaPhone,
  toE164ColombiaPhone,
  phoneStorageVariants,
  phoneIdentityKey,
} from '@/lib/phone';

/**
 * IDENTIDAD TELEFÓNICA CANÓNICA (P0).
 * `3001234567`, `+573001234567` y `573001234567` DEBEN resolver a UN MISMO
 * valor canónico `573001234567` (formato persistido en BD, sin `+`).
 */
const SAME_LINE_INPUTS = ['3001234567', '+573001234567', '573001234567'];

describe('phone: canonicalización colombiana', () => {
  it('las 3 formas del mismo número producen EL MISMO canónico', () => {
    for (const input of SAME_LINE_INPUTS) {
      expect(canonicalColombiaPhone(input)).toBe('573001234567');
      expect(phoneIdentityKey(input)).toBe('573001234567');
    }
  });

  it('formatos con separadores y prefijo internacional 00 también canonicalizan', () => {
    expect(canonicalColombiaPhone('(300) 123-4567')).toBe('573001234567');
    expect(canonicalColombiaPhone('300 123 4567')).toBe('573001234567');
    expect(canonicalColombiaPhone('00573001234567')).toBe('573001234567');
    expect(canonicalColombiaPhone('+576012345678')).toBe('576012345678');
  });

  it('fijo moderno 60XXXXXXX canonicaliza igual con o sin indicativo', () => {
    expect(canonicalColombiaPhone('6063335206')).toBe('576063335206');
    expect(canonicalColombiaPhone('+576063335206')).toBe('576063335206');
    expect(canonicalColombiaPhone('576063335206')).toBe('576063335206');
  });

  it('números inválidos o no colombianos => null (sin manglear)', () => {
    expect(canonicalColombiaPhone(null)).toBeNull();
    expect(canonicalColombiaPhone('')).toBeNull();
    expect(canonicalColombiaPhone('abc')).toBeNull();
    expect(canonicalColombiaPhone('12345')).toBeNull();
    expect(canonicalColombiaPhone('30012345671234')).toBeNull();
    // Extranjeros: se rechazan, no se inventa un canónico
    expect(canonicalColombiaPhone('+593 99 123 4567')).toBeNull();
    expect(canonicalColombiaPhone('0998765432')).toBeNull();
  });

  it('toE164ColombiaPhone da el formato E.164 para Twilio desde cualquier forma', () => {
    for (const input of SAME_LINE_INPUTS) {
      expect(toE164ColombiaPhone(input)).toBe('+573001234567');
    }
  });

  it('phoneStorageVariants: canónico primero + forma legada local (compatibilidad datos previos)', () => {
    expect(phoneStorageVariants('+573001234567')).toEqual(['573001234567', '3001234567']);
    expect(phoneStorageVariants('3001234567')).toEqual(['573001234567', '3001234567']);
    expect(phoneStorageVariants(null)).toEqual([]);
  });
});
