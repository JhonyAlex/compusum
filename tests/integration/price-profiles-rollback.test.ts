import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createPriceProfile,
  updatePriceProfile,
  getPriceProfile,
  PriceProfileAdminError,
} from '@/lib/price-profiles';

/**
 * TEST DE INTEGRACIÓN PostgreSQL REAL — atomicidad del CRUD de PriceProfile.
 *
 * Garantía P0/P1: una actualización con un override INVÁLIDO (FK inexistente)
 * debe fallar SIN dejar efectos parciales: el perfil y sus overrides
 * anteriores quedan EXACTAMENTE iguales (misma %, mismos overrides, mismo
 * isDefault). Se ejecuta contra la BD de la CI (servicio postgres) o contra
 * DATABASE_URL local; si no hay PostgreSQL se omite explícitamente.
 */

const HAS_POSTGRES = Boolean(process.env.DATABASE_URL?.startsWith('postgres'));
const d = it.skipIf(!HAS_POSTGRES);

// Datos fijos del run (limpieza por prefijo para ser re-ejecutable)
const CODE = `ROLLBACK-${Date.now()}`;

let categoryId: string;
let productId: string;
let variantId: string;
let profileId: string;

beforeAll(async () => {
  if (!HAS_POSTGRES) return;

  const category = await db.category.create({
    data: { name: `Cat rollback ${CODE}`, slug: `cat-rb-${CODE}` },
  });
  categoryId = category.id;

  const product = await db.product.create({
    data: {
      name: 'Producto rollback test',
      slug: `prod-rb-${CODE}`,
      price: 10000,
      wholesalePrice: 8000,
      categoryId,
      variants: {
        create: { name: 'Variante A', normalizedName: 'variante a', price: 5000, wholesalePrice: 4000 },
      },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
}, 30000);

afterAll(async () => {
  if (!HAS_POSTGRES) return;
  // Limpieza: cascada elimina overrides; productos/variantes/categoría propios del run
  await db.priceProfile.deleteMany({ where: { code: CODE } });
  await db.product.deleteMany({ where: { slug: `prod-rb-${CODE}` } });
  await db.category.deleteMany({ where: { slug: `cat-rb-${CODE}` } });
  await db.$disconnect();
}, 30000);

d('CRUD de PriceProfile es transaccional (rollback real en PostgreSQL)', async () => {
  // 1) Perfil EXISTENTE con overrides válidos
  const created = await createPriceProfile({
    name: 'Perfil rollback',
    code: CODE,
    percentAdjustment: -5,
    productOverrides: [{ productId, wholesalePrice: 7500 }],
  });
  profileId = created!.id;

  const before = await getPriceProfile(profileId);
  expect(before!.productOverrides).toHaveLength(1);
  expect(before!.productOverrides[0].wholesalePrice).toBe(7500);
  expect(before!.percentAdjustment).toBe(-5);
  expect(before!.isDefault).toBe(false);

  // Snapshot EXACTO del estado previo
  const snapshot = JSON.parse(JSON.stringify(before));

  // 2) Intento de actualización con override INVÁLIDO (producto inexistente)
  await expect(
    updatePriceProfile(profileId, {
      name: 'Perfil rollback MODIFICADO',
      percentAdjustment: -50,
      productOverrides: [
        { productId, wholesalePrice: 9999 },
        { productId: 'producto-inexistente-fake-id', wholesalePrice: 1 },
      ],
    })
  ).rejects.toThrow(PriceProfileAdminError);

  // 3) La operación falló => perfil y overrides anteriores EXACTAMENTE iguales
  const after = await getPriceProfile(profileId);
  expect(JSON.parse(JSON.stringify(after))).toEqual(snapshot);
  expect(after!.name).toBe('Perfil rollback');
  expect(after!.percentAdjustment).toBe(-5);
  expect(after!.productOverrides).toHaveLength(1);
  expect(after!.productOverrides[0].wholesalePrice).toBe(7500);

  // 4) La actualización VÁLIDA (misma forma de llamada, referencias reales) sí aplica completo
  const updated = await updatePriceProfile(profileId, {
    name: 'Perfil rollback v2',
    percentAdjustment: -8,
    productOverrides: [{ productId, wholesalePrice: 7200 }],
    variantOverrides: [{ variantId, wholesalePrice: 3600 }],
  });
  expect(updated!.name).toBe('Perfil rollback v2');
  expect(updated!.percentAdjustment).toBe(-8);
  expect(updated!.productOverrides).toHaveLength(1);
  expect(updated!.productOverrides[0].wholesalePrice).toBe(7200);
  expect(updated!.variantOverrides).toHaveLength(1);
  expect(updated!.variantOverrides[0].wholesalePrice).toBe(3600);

  // 5) isDefault exclusivo incluso bajo la escritura transaccional
  await updatePriceProfile(profileId, { isDefault: true });
  const defaulted = await getPriceProfile(profileId);
  expect(defaulted!.isDefault).toBe(true);
  const defaultsCount = await db.priceProfile.count({ where: { isDefault: true } });
  expect(defaultsCount).toBe(1);
}, 30000);

d('creación con FK inválida NO deja perfil creado a medias', async () => {
  const beforeCount = await db.priceProfile.count();

  await expect(
    createPriceProfile({
      name: 'Perfil fantasma',
      code: `${CODE}-GHOST`,
      productOverrides: [{ productId: 'producto-inexistente-fake-id', wholesalePrice: 1 }],
    })
  ).rejects.toThrow(PriceProfileAdminError);

  expect(await db.priceProfile.count()).toBe(beforeCount);
  expect(await db.priceProfile.findUnique({ where: { code: `${CODE}-GHOST` } })).toBeNull();
}, 30000);
