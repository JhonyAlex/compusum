export function formatPrice(price: number | null | undefined, fallback = "$0"): string {
  if (!price) return fallback;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
