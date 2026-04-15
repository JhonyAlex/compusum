/**
 * CSV Import — field mapping, grouping by reference, and product/variant building.
 */

// ─── Target fields ────────────────────────────────────────────────────────────

export const PRODUCT_FIELDS = [
  { key: 'reference', label: 'Referencia / SKU', required: true, description: 'Agrupa filas en un solo producto' },
  { key: 'name', label: 'Nombre del producto', required: true, description: 'Nombre visible en la tienda' },
  { key: 'description', label: 'Descripción', required: false, description: 'Descripción larga del producto' },
  { key: 'shortDescription', label: 'Descripción corta', required: false, description: 'Resumen o texto breve' },
  { key: 'brand', label: 'Marca', required: false, description: 'Nombre de la marca' },
  { key: 'price', label: 'Precio unitario', required: false, description: 'Precio de venta' },
  { key: 'stock', label: 'Existencia', required: false, description: 'Cantidad en inventario' },
  { key: 'image', label: 'Imagen', required: false, description: 'Nombre de archivo o URL de imagen' },
  { key: 'variantName', label: 'Nombre de variación', required: false, description: 'Ej: Verde Limón, Cuadros, Rayas' },
  { key: 'variantCode', label: 'Código de variación', required: false, description: 'Código interno de la variación' },
] as const;

export type ProductFieldKey = (typeof PRODUCT_FIELDS)[number]['key'];

/** Maps CSV column header (lowercase) → target field key */
export type FieldMapping = Partial<Record<ProductFieldKey, string>>;

// ─── Auto-detection of column → field mapping ─────────────────────────────────

const COLUMN_HINTS: Record<ProductFieldKey, string[]> = {
  reference: ['referencia', 'sku', 'ref', 'código', 'codigo', 'code'],
  name: ['nombre', 'name', 'producto', 'product'],
  description: ['desc. item', 'descripcion larga', 'description', 'descripcion'],
  shortDescription: ['descripcion corta', 'short description', 'resumen'],
  brand: ['marca', 'brand'],
  price: ['precio unitario', 'precio', 'price', 'valor'],
  stock: ['existencia', 'stock', 'inventario', 'cantidad'],
  image: ['nombre archivo', 'imagen', 'image', 'foto', 'img'],
  variantName: ['extensión final', 'extension final', 'variación', 'variacion', 'variant', 'color', 'talla'],
  variantCode: ['columna 1', 'código variación', 'variant code'],
};

export function detectDefaultMapping(csvHeaders: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  const lowerHeaders = csvHeaders.map((h) => h.toLowerCase().trim());

  for (const field of PRODUCT_FIELDS) {
    const hints = COLUMN_HINTS[field.key];
    for (const hint of hints) {
      const idx = lowerHeaders.indexOf(hint);
      if (idx !== -1) {
        mapping[field.key] = csvHeaders[idx];
        break;
      }
    }
  }

  return mapping;
}

// ─── Grouped product type ─────────────────────────────────────────────────────

export interface VariantRow {
  name: string;
  code: string | null;
  price: number | null;
  stock: number | null;
}

export interface ProductGroup {
  reference: string;
  name: string;
  description: string;
  shortDescription: string;
  brand: string;
  price: number | null;
  stock: number | null;
  image: string;
  variants: VariantRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCurrencyClient(value?: string): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/[^\d.,]/g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeVariantName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isGenericVariant(name: string): boolean {
  const n = normalizeVariantName(name);
  return n === 'gn' || n === 'generico' || n === 'no subir';
}

// ─── Group CSV rows into products ─────────────────────────────────────────────

export interface GroupingStats {
  totalRows: number;
  uniqueProducts: number;
  productsWithVariants: number;
  totalVariants: number;
  skippedGenericOnly: number;
}

export interface GroupResult {
  products: ProductGroup[];
  stats: GroupingStats;
  errors: string[];
}

export function groupRowsIntoProducts(
  rows: Record<string, string>[],
  mapping: FieldMapping,
  skipGenericVariants: boolean = true,
): GroupResult {
  const errors: string[] = [];
  const grouped = new Map<string, { baseRow: Record<string, string>; allRows: Record<string, string>[] }>();

  // Step 1: Group rows by reference
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ref = mapping.reference ? row[mapping.reference]?.trim() : '';
    if (!ref) {
      errors.push(`Fila ${i + 2}: referencia vacía, se omite`);
      continue;
    }

    const existing = grouped.get(ref);
    if (existing) {
      existing.allRows.push(row);
    } else {
      grouped.set(ref, { baseRow: row, allRows: [row] });
    }
  }

  // Step 2: Build product groups
  const products: ProductGroup[] = [];
  let skippedGenericOnly = 0;
  let totalVariants = 0;
  let productsWithVariants = 0;

  for (const [ref, { baseRow, allRows }] of grouped) {
    const getField = (key: ProductFieldKey) => {
      const col = mapping[key];
      return col ? baseRow[col]?.trim() ?? '' : '';
    };

    const name = getField('name');
    if (!name) {
      errors.push(`Referencia ${ref}: nombre vacío, se omite`);
      continue;
    }

    // Build variants from ALL rows in the group
    const variants: VariantRow[] = [];
    const seenNormalized = new Set<string>();

    for (const row of allRows) {
      const vNameCol = mapping.variantName;
      const vCodeCol = mapping.variantCode;
      const vPriceCol = mapping.price;
      const vStockCol = mapping.stock;

      const rawVName = vNameCol ? row[vNameCol]?.trim() ?? '' : '';
      const vCode = vCodeCol ? row[vCodeCol]?.trim() ?? null : null;
      const vPrice = vPriceCol ? parseCurrencyClient(row[vPriceCol]) : null;
      const vStock = vStockCol ? parseInt(row[vStockCol]?.trim() ?? '', 10) || null : null;

      if (!rawVName) continue;

      // Skip generic variants if configured and all variants are generic
      if (skipGenericVariants && isGenericVariant(rawVName) && allRows.length === 1) {
        continue;
      }

      // Deduplicate by normalized name (combine codes)
      const normalized = normalizeVariantName(rawVName);
      if (seenNormalized.has(normalized)) continue;
      seenNormalized.add(normalized);

      // Capitalize first letter of each word for display
      const displayName = rawVName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .trim();

      variants.push({ name: displayName, code: vCode, price: vPrice, stock: vStock });
    }

    if (skipGenericVariants && allRows.length === 1 && variants.length === 0) {
      skippedGenericOnly++;
    }

    if (variants.length > 0) {
      productsWithVariants++;
      totalVariants += variants.length;
    }

    products.push({
      reference: ref,
      name,
      description: getField('description'),
      shortDescription: getField('shortDescription'),
      brand: getField('brand'),
      price: parseCurrencyClient(getField('price')),
      stock: mapping.stock ? parseInt(baseRow[mapping.stock]?.trim() ?? '', 10) || null : null,
      image: getField('image'),
      variants,
    });
  }

  return {
    products,
    stats: {
      totalRows: rows.length,
      uniqueProducts: products.length,
      productsWithVariants,
      totalVariants,
      skippedGenericOnly,
    },
    errors,
  };
}
