const DEFAULT_PRODUCT_NAME = "Producto sin nombre";
const DEFAULT_PRODUCT_SLUG = "producto";
const DEFAULT_BRAND_NAME = "Marca no especificada";
const DEFAULT_BRAND_SLUG = "marca";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveProductName(name: unknown): string {
  return isNonEmptyString(name) ? name.trim() : DEFAULT_PRODUCT_NAME;
}

export function resolveProductSlug(slug: unknown): string {
  return isNonEmptyString(slug) ? slug.trim() : DEFAULT_PRODUCT_SLUG;
}

export function resolveBrandName(name: unknown): string {
  return isNonEmptyString(name) ? name.trim() : DEFAULT_BRAND_NAME;
}

export function resolveBrandSlug(slug: unknown): string {
  return isNonEmptyString(slug) ? slug.trim() : DEFAULT_BRAND_SLUG;
}

export function resolveProductImageSrc(slug: unknown, size: string): string {
  const safeSlug = resolveProductSlug(slug);
  return `https://picsum.photos/seed/${safeSlug}/${size}`;
}

export function resolveBrandLogoSrc(logo: unknown, brandSlug: unknown, size: string): string {
  if (isNonEmptyString(logo)) {
    return logo.trim();
  }
  const safeBrandSlug = resolveBrandSlug(brandSlug);
  return `https://picsum.photos/seed/${safeBrandSlug}/${size}`;
}

export function normalizeProductImagePath(imagePath: unknown): string {
  if (!isNonEmptyString(imagePath)) {
    return "";
  }

  const value = imagePath.trim();
  if (
    value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("data:")
    || value.startsWith("blob:")
    || value.startsWith("/")
  ) {
    return value;
  }

  const filenameOnly = value.replace(/^.*[\\/]/, "");
  return `/uploads/${filenameOnly}`;
}
