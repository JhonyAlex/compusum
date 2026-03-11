/**
 * Shared CSV parsing utility for both server and client usage.
 * Handles quoted fields, various line endings, and normalizes headers.
 */

/**
 * Parse a CSV string into an array of row objects keyed by normalized headers.
 * 
 * @param raw - The raw CSV string content
 * @returns Array of objects where keys are lowercase header names
 * 
 * @example
 * ```typescript
 * const rows = parseCSV('name,price\n"Product A",100');
 * // Returns: [{ name: 'Product A', price: '100' }]
 * ```
 */
export function parseCSV(raw: string): Record<string, string>[] {
  // Normalize line endings
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  /**
   * Parse a single CSV row, handling quoted fields.
   * Supports double-quote escaping within quoted fields.
   */
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let inQuote = false;
    let current = '';
    
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      
      if (ch === '"') {
        // Handle escaped quotes (double quotes inside quoted field)
        if (inQuote && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    
    // Push the last cell
    cells.push(current.trim());
    return cells;
  };

  // Parse headers and normalize to lowercase
  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const cells = parseRow(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    
    rows.push(row);
  }

  return rows;
}

/**
 * Required columns for product import CSV.
 */
export const REQUIRED_CSV_COLUMNS = ['marca', 'nombre', 'sku', 'precio', 'categoria'];

/**
 * Validate that CSV rows contain all required columns.
 * 
 * @param rows - Parsed CSV rows
 * @returns Array of missing column names, empty if all present
 */
export function validateRequiredColumns(rows: Record<string, string>[]): string[] {
  if (rows.length === 0) return REQUIRED_CSV_COLUMNS;
  
  const headers = Object.keys(rows[0]).map((k) => k.toLowerCase());
  return REQUIRED_CSV_COLUMNS.filter((c) => !headers.includes(c));
}
