import { db } from "@/lib/db";

/**
 * Checks whether a product should be displayed in Catalog Mode
 * (i.e., prices hidden and purchase actions disabled).
 *
 * Priority order (highest wins):
 *  1. Product-level catalogMode flag
 *  2. Category-level catalogMode flag
 *  3. Brand-level catalogMode flag
 *  4. Global store catalogMode setting
 */
export async function isProductInCatalogMode(productId: string): Promise<boolean> {
  // Fetch the product with its category and brand in one query
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      catalogMode: true,
      category: { select: { catalogMode: true } },
      brand: { select: { catalogMode: true } },
    },
  });

  if (!product) return false;

  // Product-level override
  if (product.catalogMode) return true;

  // Category-level override
  if (product.category?.catalogMode) return true;

  // Brand-level override
  if (product.brand?.catalogMode) return true;

  // Global store setting
  return isGlobalCatalogModeEnabled();
}

/**
 * Checks the global store catalog mode setting.
 */
export async function isGlobalCatalogModeEnabled(): Promise<boolean> {
  const setting = await db.setting.findUnique({
    where: { key: "catalog_mode_enabled" },
    select: { value: true },
  });

  return setting?.value === "true";
}

/**
 * Resolves catalog mode status for a product given its already-fetched data
 * (avoids an extra DB call when the data is already available).
 */
export function resolveCatalogMode(
  productCatalogMode: boolean,
  categoryCatalogMode: boolean,
  brandCatalogMode: boolean | undefined | null,
  globalCatalogMode: boolean
): boolean {
  return (
    productCatalogMode ||
    categoryCatalogMode ||
    (brandCatalogMode ?? false) ||
    globalCatalogMode
  );
}
