import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { isGlobalCatalogModeEnabled } from "@/lib/catalog-mode";

const DEFAULT_REVALIDATE = 60; // seconds

/**
 * Cached: get categories with product counts (for sidebar/filters).
 */
export const getCachedCategories = unstable_cache(
  async () => {
    return db.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });
  },
  ["categories"],
  { tags: ["categories"], revalidate: DEFAULT_REVALIDATE }
);

/**
 * Cached: get brands with product counts (for sidebar/filters).
 */
export const getCachedBrands = unstable_cache(
  async () => {
    return db.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });
  },
  ["brands"],
  { tags: ["brands"], revalidate: DEFAULT_REVALIDATE }
);

/**
 * Cached: get a single product by slug (for detail page).
 */
export const getCachedProductBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      return db.product.findUnique({
        where: { slug },
        include: {
          brand: true,
          category: { include: { parent: true } },
          images: { orderBy: { sortOrder: "asc" } },
          variants: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      });
    },
    [`product-${slug}`],
    { tags: [`product-${slug}`, "products"], revalidate: DEFAULT_REVALIDATE }
  )();

/**
 * Cached: get global catalog mode setting.
 */
export const getCachedGlobalCatalogMode = unstable_cache(
  async () => {
    return isGlobalCatalogModeEnabled();
  },
  ["global-catalog-mode"],
  { tags: ["settings"], revalidate: DEFAULT_REVALIDATE }
);

/**
 * Cached: get featured products for home page.
 */
export const getCachedFeaturedProducts = unstable_cache(
  async () => {
    return db.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        wholesalePrice: true,
        minWholesaleQty: true,
        isFeatured: true,
        isNew: true,
        isActive: true,
        catalogMode: true,
        stockStatus: true,
        sortOrder: true,
        createdAt: true,
        brand: { select: { name: true, slug: true, catalogMode: true } },
        category: { select: { name: true, slug: true, catalogMode: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { imagePath: true, thumbnailPath: true, altText: true },
        },
        _count: {
          select: {
            variants: { where: { isActive: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
    });
  },
  ["featured-products"],
  { tags: ["featured-products", "products"], revalidate: DEFAULT_REVALIDATE }
);

/**
 * Cached: get new products for home page.
 */
export const getCachedNewProducts = unstable_cache(
  async () => {
    return db.product.findMany({
      where: { isActive: true, isNew: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        wholesalePrice: true,
        minWholesaleQty: true,
        isFeatured: true,
        isNew: true,
        isActive: true,
        catalogMode: true,
        stockStatus: true,
        sortOrder: true,
        createdAt: true,
        brand: { select: { name: true, slug: true, catalogMode: true } },
        category: { select: { name: true, slug: true, catalogMode: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { imagePath: true, thumbnailPath: true, altText: true },
        },
        _count: {
          select: {
            variants: { where: { isActive: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
    });
  },
  ["new-products"],
  { tags: ["new-products", "products"], revalidate: DEFAULT_REVALIDATE }
);
