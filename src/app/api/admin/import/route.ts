import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseCSV, validateRequiredColumns, REQUIRED_CSV_COLUMNS } from '@/lib/csv';

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── helpers ─────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── POST /api/admin/import ───────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';

  // ── Stream / batch support via URL params ────────────────────────────────
  const { searchParams } = new URL(request.url);
  const duplicateMode = searchParams.get('duplicateMode') ?? 'skip'; // 'update' | 'skip'
  const batchIndex = parseInt(searchParams.get('batchIndex') ?? '0');
  const batchSize = parseInt(searchParams.get('batchSize') ?? '50');

  let rows: Record<string, string>[] = [];

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ success: false, error: 'Archivo no encontrado en el formulario' }, { status: 400 });
      }
      // Validate file size
      if ((file as File).size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'El archivo supera el límite de 5MB.' }, { status: 400 });
      }
      const text = await (file as File).text();
      rows = parseCSV(text);
    } else {
      // JSON body with pre-parsed rows (used by the chunked client)
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ success: false, error: 'JSON malformado en el cuerpo de la petición' }, { status: 400 });
      }
      rows = body.rows ?? [];
      if (!Array.isArray(rows)) {
        return NextResponse.json({ success: false, error: 'El campo "rows" debe ser un arreglo' }, { status: 400 });
      }
    }
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: `Error al procesar el archivo: ${message}` }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'El archivo no contiene filas de datos' }, { status: 400 });
  }

  // ── Validate required columns on first batch ─────────────────────────────
  if (batchIndex === 0) {
    const missing = validateRequiredColumns(rows);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Columnas requeridas ausentes: ${missing.join(', ')}` },
        { status: 400 },
      );
    }
  }

  // ── Slice this batch ──────────────────────────────────────────────────────
  const batch = rows.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  // Pre-load brands & categories to minimise DB calls inside the loop
  const [allBrands, allCategories] = await Promise.all([
    db.brand.findMany({ select: { id: true, name: true, slug: true } }),
    db.category.findMany({ select: { id: true, name: true, slug: true, parentId: true } }),
  ]);

  const brandMap = new Map(allBrands.map((b) => [b.name.toLowerCase(), b]));
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c]));

  for (let i = 0; i < batch.length; i++) {
    const rowNum = batchIndex * batchSize + i + 2; // 1-based, +1 for header
    const row = batch[i];

    try {
      // ── Field extraction & basic validation ────────────────────────────
      const brandName = row['marca']?.trim();
      const rawName = row['nombre']?.trim();
      const sku = row['sku']?.trim();
      const rawPrice = row['precio']?.trim().replace(/[^\d.,]/g, '').replace(',', '.');
      const rawWholesalePrice = row['precio descuento']?.trim().replace(/[^\d.,]/g, '').replace(',', '.');
      const categoryPath = row['categoria']?.trim();
      const subcategoryName = row['subcategoria']?.trim();
      const shortDescription = row['descripcion corta']?.trim() ?? '';
      const description = row['descripcion larga']?.trim() ?? '';
      const imageUrl = row['imagen']?.trim() ?? '';

      if (!rawName) { result.errors.push(`Fila ${rowNum}: "nombre" vacío`); continue; }
      if (!sku) { result.errors.push(`Fila ${rowNum}: "sku" vacío`); continue; }
      if (!categoryPath) { result.errors.push(`Fila ${rowNum}: "categoria" vacía`); continue; }

      const price = rawPrice ? parseFloat(rawPrice) : null;
      const wholesalePrice = rawWholesalePrice ? parseFloat(rawWholesalePrice) : null;

      if (rawPrice && isNaN(price!)) {
        result.errors.push(`Fila ${rowNum}: precio inválido "${row['precio']}"`);
        continue;
      }
      if (rawWholesalePrice && isNaN(wholesalePrice!)) {
        result.errors.push(`Fila ${rowNum}: precio descuento inválido "${row['precio descuento']}"`);
        continue;
      }

      // ── Auto-create brand ───────────────────────────────────────────────
      let brandId: string | null = null;
      if (brandName) {
        let brand = brandMap.get(brandName.toLowerCase());
        if (!brand) {
          let slug = toSlug(brandName);
          // Ensure slug uniqueness
          const existing = await db.brand.findUnique({ where: { slug } });
          if (existing) slug = `${slug}-${Date.now()}`;
          const created = await db.brand.create({ data: { name: brandName, slug } });
          brand = { id: created.id, name: created.name, slug: created.slug };
          brandMap.set(brandName.toLowerCase(), brand);
        }
        brandId = brand.id;
      }

      // ── Auto-create category (and optional sub-category) ────────────────
      // Support "Hogar > Cocina" or "Hogar" notation
      const separator = categoryPath.includes(' > ') ? ' > ' : '>';
      const parts = categoryPath.split(separator).map((p) => p.trim()).filter(Boolean);
      const mainCategoryName = parts[0];
      const subFromPath = parts[1] ?? subcategoryName ?? '';

      let parentCategoryId: string | null = null;
      {
        let cat = categoryMap.get(mainCategoryName.toLowerCase());
        if (!cat) {
          let slug = toSlug(mainCategoryName);
          const existing = await db.category.findUnique({ where: { slug } });
          if (existing) slug = `${slug}-${Date.now()}`;
          const created = await db.category.create({ data: { name: mainCategoryName, slug } });
          cat = { id: created.id, name: created.name, slug: created.slug, parentId: null };
          categoryMap.set(mainCategoryName.toLowerCase(), cat);
        }
        parentCategoryId = cat.id;
      }

      let finalCategoryId = parentCategoryId;
      if (subFromPath) {
        const subKey = subFromPath.toLowerCase();
        let subCat = categoryMap.get(subKey);
        if (!subCat) {
          let slug = toSlug(subFromPath);
          const existing = await db.category.findUnique({ where: { slug } });
          if (existing) slug = `${slug}-${Date.now()}`;
          const created = await db.category.create({
            data: { name: subFromPath, slug, parentId: parentCategoryId },
          });
          subCat = { id: created.id, name: created.name, slug: created.slug, parentId: parentCategoryId };
          categoryMap.set(subKey, subCat);
        }
        finalCategoryId = subCat.id;
      }

      // ── Slug for the product ────────────────────────────────────────────
      const baseSlug = toSlug(rawName);

      // ── Check for duplicate SKU ─────────────────────────────────────────
      const existing = await db.product.findUnique({ where: { sku } });

      if (existing) {
        if (duplicateMode === 'skip') {
          result.skipped++;
          continue;
        }
        // mode === 'update'
        await db.product.update({
          where: { id: existing.id },
          data: {
            name: rawName,
            shortDescription,
            description,
            categoryId: finalCategoryId,
            brandId,
            price,
            wholesalePrice,
            ...(imageUrl && {
              images: {
                deleteMany: {},
                create: [{ imagePath: imageUrl, isPrimary: true, sortOrder: 0 }],
              },
            }),
          },
        });
        result.updated++;
      } else {
        // New product — ensure slug uniqueness
        let slug = baseSlug;
        const slugExists = await db.product.findUnique({ where: { slug } });
        if (slugExists) slug = `${slug}-${Date.now()}`;

        await db.product.create({
          data: {
            name: rawName,
            slug,
            sku,
            shortDescription,
            description,
            categoryId: finalCategoryId,
            brandId,
            price,
            wholesalePrice,
            ...(imageUrl && {
              images: {
                create: [{ imagePath: imageUrl, isPrimary: true, sortOrder: 0 }],
              },
            }),
          },
        });
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Fila ${rowNum}: ${err?.message ?? 'Error desconocido'}`);
    }
  }

  const totalRows = rows.length;
  const totalBatches = Math.ceil(totalRows / batchSize);

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      batchIndex,
      totalBatches,
      totalRows,
      done: batchIndex + 1 >= totalBatches,
    },
  });
}
