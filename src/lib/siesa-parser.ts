/**
 * Siesa CSV Parser and Colombian Currency Normalizer.
 * Supports CP1252 / Windows-1252 encoding, string SKU preservation,
 * deterministic unquoted price/inventory extraction, and variant grouping.
 */

export interface SiesaRawItem {
  lineNum: number;
  um: string;
  name: string;
  brand: string;
  reference: string;
  price: number;
  stock: number;
  variantDetail: string;
  variantNormal: string;
}

export interface SiesaVariant {
  name: string;
  code: string | null;
  price: number;
  stockQuantity: number;
  stockStatus: string;
}

export interface SiesaProductGroup {
  reference: string;
  name: string;
  brand: string;
  unitOfMeasure: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  isZeroPrice: boolean;
  variants: SiesaVariant[];
  rawRowsCount: number;
}

export interface ParsedSiesaResult {
  totalRows: number;
  products: SiesaProductGroup[];
  uniqueReferences: number;
  zeroPriceReferences: number;
  errors: string[];
}

/**
 * Decodes buffer into string using windows-1252 (CP1252),
 * or UTF-8 if UTF-8 BOM is detected.
 */
export function decodeSiesaBuffer(input: Buffer | Uint8Array | string): string {
  if (typeof input === 'string') {
    return input;
  }

  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  // Check UTF-8 BOM (0xEF, 0xBB, 0xBF)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }

  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/**
 * Deterministically parses Colombian formatted currency into a standard number.
 * Colombian format:
 * - Thousands separator: '.' (period)
 * - Decimal separator: ',' (comma)
 *
 * Example:
 * "$1.845,02" -> 1845.02
 * "$725,16"   -> 725.16
 * "$0,00"     -> 0
 * "$8.640,00" -> 8640
 */
export function parseColombianPrice(priceStr?: string | number | null): number {
  if (priceStr === null || priceStr === undefined || priceStr === '') return 0;
  if (typeof priceStr === 'number') {
    return Number.isFinite(priceStr) ? Math.round(priceStr * 100) / 100 : 0;
  }

  // Remove currency symbols and whitespace
  const clean = priceStr.trim().replace(/\$/g, '').replace(/\s+/g, '');
  if (!clean) return 0;

  // In Colombian format, '.' is thousand separator and ',' is decimal separator.
  // We strip '.' and replace ',' with '.'
  const standard = clean.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(standard);
  if (!Number.isFinite(num)) return 0;

  return Math.round(num * 100) / 100;
}

/**
 * Normalizes variant names for display (e.g. "AZ CELEST" -> "Az Celest", "NEGRO" -> "Negro").
 */
export function formatVariantDisplayName(detail: string): string {
  const trimmed = detail.trim();
  if (!trimmed) return 'Estándar';

  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Checks if a variant name represents a generic single-SKU marker (e.g. "GN", "GENERICO").
 */
export function isGenericVariantMarker(name: string): boolean {
  const normalized = name.trim().toLowerCase().replace(/\./g, '');
  return normalized === 'gn' || normalized === 'generico' || normalized === 'unidad' || normalized === 'genérico';
}

/**
 * Checks if CSV header matches Siesa export layout.
 */
export function isSiesaCSVHeader(headerLine: string): boolean {
  const lower = headerLine.toLowerCase();
  return (
    lower.includes('u.m.') &&
    lower.includes('desc. item') &&
    lower.includes('marca') &&
    lower.includes('referencia') &&
    lower.includes('precio unitario') &&
    lower.includes('existencia')
  );
}

/**
 * Parses raw Siesa CSV content into structured product groups.
 * Handles the unquoted Colombian price + comma + inventory structure without heuristic drift.
 */
export function parseSiesaCSV(rawInput: string | Buffer | Uint8Array): ParsedSiesaResult {
  const text = decodeSiesaBuffer(rawInput);
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headerLine = lines[0]?.trim() || '';

  const errors: string[] = [];
  if (!isSiesaCSVHeader(headerLine)) {
    errors.push('Cabecera CSV inválida para formato Siesa. Se esperaba formato con columnas U.M., Desc. item, MARCA, Referencia, Precio unitario, Existencia.');
    return {
      totalRows: 0,
      products: [],
      uniqueReferences: 0,
      zeroPriceReferences: 0,
      errors,
    };
  }

  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);
  const rawItems: SiesaRawItem[] = [];

  // Exact regex matching the Siesa export layout:
  // 4 quoted leading columns, 1 unquoted middle ($price,decimal,existencia), 2 quoted trailing columns, trailing comma
  const siesaRowRegex = /^"((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)",(.*?),"((?:[^"]|"")*)","((?:[^"]|"")*)"\s*,?\s*$/;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const lineNum = i + 2;

    const match = line.match(siesaRowRegex);
    if (!match) {
      errors.push(`Línea ${lineNum}: formato de columnas inválido para Siesa`);
      continue;
    }

    const um = match[1].replace(/""/g, '"').trim();
    const name = match[2].replace(/""/g, '"').trim();
    const brand = match[3].replace(/""/g, '"').trim();
    // Reference / SKU MUST be preserved as string with leading zeros
    const reference = match[4].replace(/""/g, '"').trim();

    if (!reference) {
      errors.push(`Línea ${lineNum}: referencia vacía`);
      continue;
    }

    const middle = match[5].trim();
    const parts = middle.split(',');
    if (parts.length < 2) {
      errors.push(`Línea ${lineNum}: columna de precio y existencia malformada (${middle})`);
      continue;
    }

    // Colombian price has 2 decimal digits:
    // When unquoted: "$1.845,02,116" splits to ["$1.845", "02", "116"]
    // Or "$725,16,1" splits to ["$725", "16", "1"]
    // Or "$0,00,0" splits to ["$0", "00", "0"]
    // Or without decimals: "$500,10" splits to ["$500", "10"]
    let priceStr: string;
    let stockStr: string;

    if (parts.length === 3) {
      priceStr = `${parts[0]},${parts[1]}`;
      stockStr = parts[2];
    } else if (parts.length === 2) {
      priceStr = parts[0];
      stockStr = parts[1];
    } else {
      // More than 3 parts: last part is stock, preceding is price
      stockStr = parts[parts.length - 1];
      priceStr = parts.slice(0, parts.length - 1).join(',');
    }

    const price = parseColombianPrice(priceStr);
    const stockParsed = parseInt(stockStr.trim(), 10);
    const stock = Number.isFinite(stockParsed) && stockParsed >= 0 ? stockParsed : 0;

    const variantDetail = match[6].replace(/""/g, '"').trim();
    const variantNormal = match[7].replace(/""/g, '"').trim();

    rawItems.push({
      lineNum,
      um,
      name,
      brand,
      reference,
      price,
      stock,
      variantDetail,
      variantNormal,
    });
  }

  // Group by reference (case-preserving, reference preserved as string)
  const grouped = new Map<string, SiesaRawItem[]>();
  for (const item of rawItems) {
    const key = item.reference;
    const list = grouped.get(key);
    if (!list) {
      grouped.set(key, [item]);
    } else {
      list.push(item);
    }
  }

  const products: SiesaProductGroup[] = [];
  let zeroPriceCount = 0;

  for (const [reference, rows] of grouped.entries()) {
    const baseRow = rows[0];
    const isMultiRow = rows.length > 1;

    // Check if rows represent variants
    const variants: SiesaVariant[] = [];
    const seenVariantNames = new Set<string>();

    if (isMultiRow) {
      for (const row of rows) {
        const rawName = row.variantDetail || row.variantNormal || 'Estándar';
        const displayName = formatVariantDisplayName(rawName);
        const normKey = displayName.toLowerCase();

        if (seenVariantNames.has(normKey)) {
          // If duplicate variant name in same SKU, combine stock
          const existing = variants.find((v) => v.name.toLowerCase() === normKey);
          if (existing) {
            existing.stockQuantity += row.stock;
            existing.stockStatus = existing.stockQuantity > 0 ? 'disponible' : 'agotado';
          }
          continue;
        }

        seenVariantNames.add(normKey);
        variants.push({
          name: displayName,
          code: row.variantDetail.trim() || null,
          price: row.price,
          stockQuantity: row.stock,
          stockStatus: row.stock > 0 ? 'disponible' : 'agotado',
        });
      }
    } else if (baseRow.variantDetail && !isGenericVariantMarker(baseRow.variantDetail)) {
      // Single row with a non-generic variant description
      const displayName = formatVariantDisplayName(baseRow.variantDetail);
      variants.push({
        name: displayName,
        code: baseRow.variantDetail.trim() || null,
        price: baseRow.price,
        stockQuantity: baseRow.stock,
        stockStatus: baseRow.stock > 0 ? 'disponible' : 'agotado',
      });
    }

    // Aggregate inventory coherently
    const stockQuantity = variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stockQuantity, 0)
      : baseRow.stock;

    // Determine product base price
    // If variants have prices, pick the first non-zero price or baseRow price
    let productPrice = baseRow.price;
    if (productPrice === 0 && variants.length > 0) {
      const nonZeroVariant = variants.find((v) => v.price > 0);
      if (nonZeroVariant) productPrice = nonZeroVariant.price;
    }

    const isZeroPrice = productPrice === 0 && (variants.length === 0 || variants.every((v) => v.price === 0));
    if (isZeroPrice) {
      zeroPriceCount++;
    }

    const stockStatus = stockQuantity > 0 ? 'disponible' : 'agotado';

    products.push({
      reference,
      name: baseRow.name,
      brand: baseRow.brand,
      unitOfMeasure: baseRow.um,
      price: productPrice,
      stockQuantity,
      stockStatus,
      isZeroPrice,
      variants,
      rawRowsCount: rows.length,
    });
  }

  return {
    totalRows: dataLines.length,
    products,
    uniqueReferences: products.length,
    zeroPriceReferences: zeroPriceCount,
    errors,
  };
}
