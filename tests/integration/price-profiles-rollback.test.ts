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
  // Limpieza: cascada elimina overrides; perfiles/productos/categorías propios del run
  await db.priceProfile.deleteMany({ where: { code: { startsWith: CODE } } });
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

d('PROMOCIÓN de default: A default -> promover B => A=false, B=true, count=1', async () => {
  // A nace default (desmarca cualquier default previo de otros tests)
  const a = await createPriceProfile({ name: 'Default A', code: `${CODE}-DA`, isDefault: true });
  const b = await createPriceProfile({ name: 'Default B', code: `${CODE}-DB`, isDefault: false });
  expect(a!.isDefault).toBe(true);

  // Promover B a default: ANTES fallaba (índice único rechazaba el update)
  await updatePriceProfile(b!.id, { isDefault: true });

  const aAfter = await db.priceProfile.findUnique({ where: { id: a!.id } });
  const bAfter = await db.priceProfile.findUnique({ where: { id: b!.id } });
  expect(aAfter!.isDefault).toBe(false);
  expect(bAfter!.isDefault).toBe(true);
  expect(await db.priceProfile.count({ where: { isDefault: true } })).toBe(1);
}, 30000);

d('CREAR default directo existiendo OTRO default => nuevo true, anterior false, count=1', async () => {
  const currentDefault = await db.priceProfile.findFirst({ where: { isDefault: true } });
  expect(currentDefault).not.toBeNull();

  const c = await createPriceProfile({ name: 'Default C', code: `${CODE}-DC`, isDefault: true });
  expect(c!.isDefault).toBe(true);

  const previous = await db.priceProfile.findUnique({ where: { id: currentDefault!.id } });
  expect(previous!.isDefault).toBe(false);
  expect(await db.priceProfile.count({ where: { isDefault: true } })).toBe(1);
}, 30000);

d('ROLLBACK de promoción: fallo previo a la escritura deja el default EXACTO como estaba', async () => {
  const defaultsBefore = await db.priceProfile.findMany({
    where: { isDefault: true },
    select: { id: true },
  });
  expect(defaultsBefore).toHaveLength(1);

  const candidate = await createPriceProfile({
    name: 'Candidato fallido',
    code: `${CODE}-RC`,
    isDefault: false,
  });

  await expect(
    updatePriceProfile(candidate!.id, {
      isDefault: true,
      productOverrides: [{ productId: 'producto-inexistente-fake-id', wholesalePrice: 1 }],
    })
  ).rejects.toThrow(PriceProfileAdminError);

  const candAfter = await db.priceProfile.findUnique({ where: { id: candidate!.id } });
  expect(candAfter!.isDefault).toBe(false);
  const defaultsAfter = await db.priceProfile.findMany({
    where: { isDefault: true },
    select: { id: true },
  });
  expect(defaultsAfter.map((p: any) => p.id)).toEqual(defaultsBefore.map((p: any) => p.id));
}, 30000);

d('CONCURRENCIA natural: 2 promociones simultáneas => NUNCA dos defaults', async () => {
  const r1 = await createPriceProfile({ name: 'Race 1', code: `${CODE}-R1`, isDefault: false });
  const r2 = await createPriceProfile({ name: 'Race 2', code: `${CODE}-R2`, isDefault: false });

  const results = await Promise.allSettled([
    updatePriceProfile(r1!.id, { isDefault: true }),
    updatePriceProfile(r2!.id, { isDefault: true }),
  ]);

  // Si alguna fue rechazada, su error es CONTROLADO (DEFAULT_CONFLICT), jamás
  // un P2002 crudo de PostgreSQL/Prisma.
  for (const r of results) {
    if (r.status === 'rejected') {
      expect(r.reason).toBeInstanceOf(PriceProfileAdminError);
      expect(r.reason.code).toBe('DEFAULT_CONFLICT');
    }
  }

  // Invariante ABSOLUTO (índice único parcial): a lo sumo UN default
  const defaults = await db.priceProfile.findMany({ where: { isDefault: true } });
  expect(defaults).toHaveLength(1);
  expect([r1!.id, r2!.id]).toContain(defaults[0].id);
}, 30000);

d('CONCURRENCIA determinista: violación del índice => error CONTROLADO + rollback', async () => {
  const w1 = await createPriceProfile({ name: 'Win 1', code: `${CODE}-W1`, isDefault: false });
  const w2 = await createPriceProfile({ name: 'Win 2', code: `${CODE}-W2`, isDefault: false });

  // Pizarra limpia: ningún default confirmado antes del escenario
  await db.priceProfile.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  // tx manual marca W1 default SIN desmarcar otros (simula escritura externa
  // no coordinada). Mientras sigue abierta, el CRUD (demote-then-set) promueve
  // W2: su demote NO ve el true sin confirmar de W1, así que su set-true choca
  // de forma DETERMINISTA con el índice único parcial al confirmar tx.
  let loser!: Promise<unknown>;
  await db.$transaction(async (tx1: any) => {
    await tx1.priceProfile.update({ where: { id: w1!.id }, data: { isDefault: true } });
    loser = updatePriceProfile(w2!.id, { isDefault: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  await expect(loser).rejects.toBeInstanceOf(PriceProfileAdminError);
  await expect(loser).rejects.toMatchObject({ code: 'DEFAULT_CONFLICT' });

  // El rollback del perdedor no alteró al ganador: UN solo default
  const defaults = await db.priceProfile.findMany({ where: { isDefault: true } });
  expect(defaults).toHaveLength(1);
  expect(defaults[0].id).toBe(w1!.id);
}, 30000);
