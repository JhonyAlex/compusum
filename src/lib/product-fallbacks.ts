const DEFAULT_PRODUCT_NAME = "Producto sin nombre";
const DEFAULT_PRODUCT_SLUG = "producto";
const DEFAULT_BRAND_NAME = "Marca no especificada";
const DEFAULT_BRAND_SLUG = "marca";
const BLOCKED_IMAGE_HOSTS = ["unsplash.com", "images.unsplash.com", "source.unsplash.com"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isBlockedImageSource(value: unknown): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const candidate = value.trim().toLowerCase();

  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    try {
      const parsedUrl = new URL(candidate);
      return BLOCKED_IMAGE_HOSTS.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`));
    } catch {
      return candidate.includes("unsplash.com");
    }
  }

  return candidate.includes("unsplash.com");
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
  void slug;
  void size;
  return "";
}

export function resolveBrandLogoSrc(logo: unknown, brandSlug: unknown, size: string): string {
  void brandSlug;
  void size;

  if (isNonEmptyString(logo) && !isBlockedImageSource(logo)) {
    return logo.trim();
  }

  return "";
}

export function normalizeProductImagePath(imagePath: unknown): string {
  if (!isNonEmptyString(imagePath)) {
    return "";
  }

  const value = imagePath.trim();
  if (isBlockedImageSource(value)) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsedUrl = new URL(value);
      if (parsedUrl.pathname.startsWith("/uploads/")) {
        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }
    } catch {
      // Keep the original value when URL parsing fails.
    }
  }

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
