import { db } from "./db";

/**
 * Administración de perfiles de precio (listas comerciales).
 * El precio base Siesa (Product/ProductVariant) nunca es tocado: los perfiles
 * viven en PriceProfile + overrides separados y NO son destruidos por la
 * sincronización Siesa.
 */

export class PriceProfileAdminError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PriceProfileAdminError";
    this.code = code;
  }
}

export interface ProfileOverrideInput {
  productId?: string;
  variantId?: string;
  wholesalePrice?: number | null;
  price?: number | null;
}

export interface PriceProfileInput {
  name?: string;
  code?: string;
  description?: string | null;
  percentAdjustment?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
  productOverrides?: ProfileOverrideInput[];
  variantOverrides?: ProfileOverrideInput[];
}

function validatePriceValue(value: number | null | undefined, label: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || isNaN(value) || value < 0) {
    throw new PriceProfileAdminError(
      "INVALID_PRICE",
      `${label}: el precio debe ser un número mayor o igual a 0 (0 = requiere cotización).`
    );
  }
  return value;
}

function validateOverrides(input: PriceProfileInput): void {
  const products = input.productOverrides ?? [];
  const variants = input.variantOverrides ?? [];

  const seenProducts = new Set<string>();
  for (const o of products) {
    if (!o.productId) {
      throw new PriceProfileAdminError("INVALID_OVERRIDE", "Cada override de producto requiere productId.");
    }
    if (seenProducts.has(o.productId)) {
      throw new PriceProfileAdminError("INVALID_OVERRIDE", "Override de producto duplicado.");
    }
    seenProducts.add(o.productId);
    const wp = validatePriceValue(o.wholesalePrice, "Override de producto");
    const p = validatePriceValue(o.price, "Override de producto");
    if (wp === null && p === null) {
      throw new PriceProfileAdminError(
        "INVALID_OVERRIDE",
        "Cada override de producto requiere wholesalePrice o price."
      );
    }
  }

  const seenVariants = new Set<string>();
  for (const o of variants) {
    if (!o.variantId) {
      throw new PriceProfileAdminError("INVALID_OVERRIDE", "Cada override de variante requiere variantId.");
    }
    if (seenVariants.has(o.variantId)) {
      throw new PriceProfileAdminError("INVALID_OVERRIDE", "Override de variante duplicado.");
    }
    seenVariants.add(o.variantId);
    const wp = validatePriceValue(o.wholesalePrice, "Override de variante");
    const p = validatePriceValue(o.price, "Override de variante");
    if (wp === null && p === null) {
      throw new PriceProfileAdminError(
        "INVALID_OVERRIDE",
        "Cada override de variante requiere wholesalePrice o price."
      );
    }
  }
}

/**
 * Mantiene la exclusividad del perfil por defecto: al marcar isDefault en un
 * perfil, se desmarca el resto (transaccionalmente cuando hay tx).
 */
export async function ensureSingleDefaultProfile(
  profileId: string,
  tx: any = db
): Promise<void> {
  await tx.priceProfile.updateMany({
    where: { isDefault: true, id: { not: profileId } },
    data: { isDefault: false },
  });
}

function normalizePercent(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || isNaN(value) || value < -99 || value > 1000) {
    throw new PriceProfileAdminError(
      "INVALID_PERCENT",
      "El ajuste porcentual debe estar entre -99 y 1000."
    );
  }
  return value;
}

export async function createPriceProfile(input: PriceProfileInput, tx: any = db) {
  const name = input.name?.trim().slice(0, 120);
  const code = input.code?.trim().toUpperCase().slice(0, 60);

  if (!name || !code) {
    throw new PriceProfileAdminError("INVALID_INPUT", "Nombre y código son requeridos.");
  }
  validateOverrides(input);
  const percentAdjustment = normalizePercent(input.percentAdjustment);

  const existing = await tx.priceProfile.findUnique({ where: { code }, select: { id: true } });
  if (existing) {
    throw new PriceProfileAdminError("CODE_EXISTS", "Ya existe un perfil con ese código.");
  }

  const profile = await tx.priceProfile.create({
    data: {
      name,
      code,
      description: input.description?.trim().slice(0, 500) || null,
      percentAdjustment,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
    },
  });

  if (profile.isDefault) {
    await ensureSingleDefaultProfile(profile.id, tx);
  }

  await replaceOverrides(profile.id, input, tx);
  return getPriceProfile(profile.id, tx);
}

export async function updatePriceProfile(id: string, input: PriceProfileInput, tx: any = db) {
  const current = await tx.priceProfile.findUnique({ where: { id } });
  if (!current) {
    throw new PriceProfileAdminError("NOT_FOUND", "Perfil de precio no encontrado.");
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name?.trim().slice(0, 120);
    if (!name) throw new PriceProfileAdminError("INVALID_INPUT", "El nombre es requerido.");
    data.name = name;
  }
  if (input.code !== undefined) {
    const code = input.code?.trim().toUpperCase().slice(0, 60);
    if (!code) throw new PriceProfileAdminError("INVALID_INPUT", "El código es requerido.");
    const existing = await tx.priceProfile.findUnique({ where: { code }, select: { id: true } });
    if (existing && existing.id !== id) {
      throw new PriceProfileAdminError("CODE_EXISTS", "Ya existe un perfil con ese código.");
    }
    data.code = code;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim().slice(0, 500) || null;
  }
  if (input.percentAdjustment !== undefined) {
    data.percentAdjustment = normalizePercent(input.percentAdjustment);
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }
  if (input.isDefault !== undefined) {
    data.isDefault = input.isDefault;
  }

  validateOverrides(input);

  const updated = await tx.priceProfile.update({ where: { id }, data });

  if (updated.isDefault) {
    await ensureSingleDefaultProfile(id, tx);
  }

  if (input.productOverrides !== undefined || input.variantOverrides !== undefined) {
    await replaceOverrides(id, input, tx);
  }

  return getPriceProfile(id, tx);
}

/** Reemplaza el set completo de overrides del perfil (delete + create). */
async function replaceOverrides(profileId: string, input: PriceProfileInput, tx: any) {
  if (input.productOverrides !== undefined) {
    const rows = input.productOverrides.map((o) => ({
      profileId,
      productId: o.productId!,
      wholesalePrice: validatePriceValue(o.wholesalePrice, "Override de producto"),
      price: validatePriceValue(o.price, "Override de producto"),
    }));
    await tx.priceProfileProduct.deleteMany({ where: { profileId } });
    if (rows.length > 0) {
      await tx.priceProfileProduct.createMany({ data: rows });
    }
  }

  if (input.variantOverrides !== undefined) {
    const rows = input.variantOverrides.map((o) => ({
      profileId,
      variantId: o.variantId!,
      wholesalePrice: validatePriceValue(o.wholesalePrice, "Override de variante"),
      price: validatePriceValue(o.price, "Override de variante"),
    }));
    await tx.priceProfileVariant.deleteMany({ where: { profileId } });
    if (rows.length > 0) {
      await tx.priceProfileVariant.createMany({ data: rows });
    }
  }
}

export async function getPriceProfile(id: string, tx: any = db) {
  const profile = await tx.priceProfile.findUnique({
    where: { id },
    include: {
      productOverrides: {
        select: {
          id: true,
          productId: true,
          wholesalePrice: true,
          price: true,
          product: { select: { name: true, sku: true } },
        },
        orderBy: { id: "asc" },
      },
      variantOverrides: {
        select: {
          id: true,
          variantId: true,
          wholesalePrice: true,
          price: true,
          variant: {
            select: { name: true, code: true, product: { select: { name: true, sku: true } } },
          },
        },
        orderBy: { id: "asc" },
      },
      _count: { select: { users: true } },
    },
  });
  return profile;
}

export async function deletePriceProfile(id: string, tx: any = db) {
  const current = await tx.priceProfile.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!current) {
    throw new PriceProfileAdminError("NOT_FOUND", "Perfil de precio no encontrado.");
  }

  // Los usuarios quedan sin perfil (FK onDelete SetNull): vuelven al precio base.
  await tx.priceProfile.delete({ where: { id } });
  return { assignedUsers: current._count.users };
}
