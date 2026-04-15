import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ProductGroup } from '@/lib/csv-import';

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

function parseCurrency(value?: string): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/[^\d.,]/g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeVariantName(value?: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// ─── POST /api/admin/import ───────────────────────────────────────────────────
// Accepts pre-grouped products from the client:
//   body: { products: ProductGroup[] }
//   query: ?duplicateMode=skip|update

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const duplicateMode = searchParams.get('duplicateMode') ?? 'skip';
  if (duplicateMode !== 'skip' && duplicateMode !== 'update') {
    return NextResponse.json({ success: false, error: 'duplicateMode inválido' }, { status: 400 });
  }

  let products: ProductGroup[];
  try {
    const body = await request.json();
    products = body.products ?? [];
    if (!Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'El campo "products" debe ser un arreglo' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'JSON malformado en el cuerpo de la petición' }, { status: 400 });
  }

  if (products.length === 0) {
    return NextResponse.json({ success: false, error: 'No hay productos para importar' }, { status: 400 });
  }

  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
  let processed = 0;

  // Pre-load brands & categories to minimise DB calls inside the loop
  const [allBrands, allCategories] = await Promise.all([
    db.brand.findMany({ select: { id: true, name: true, slug: true } }),
    db.category.findMany({ select: { id: true, name: true, slug: true, parentId: true } }),
  ]);

  const brandMap = new Map(allBrands.map((b) => [b.name.toLowerCase(), b]));
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c]));

  // Ensure fallback category exists
  let fallbackCategory = categoryMap.get('sin categoria');
  if (!fallbackCategory) {
    const created = await db.category.upsert({
      where: { slug: 'sin-categoria' },
      update: {},
      create: { name: 'Sin categoria', slug: 'sin-categoria', isActive: true },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    fallbackCategory = created;
    categoryMap.set('sin categoria', created);
  }

  for (const group of products) {
    try {
      const { reference, name, description, shortDescription, brand, price, image, variants } = group;

      if (!name) { result.errors.push(`Ref ${reference}: nombre vacío`); continue; }
      if (!reference) { result.errors.push(`"${name}": referencia vacía`); continue; }

      // ── Auto-create brand ───────────────────────────────────────────────
      let brandId: string | null = null;
      if (brand) {
        let existing = brandMap.get(brand.toLowerCase());
        if (!existing) {
          let slug = toSlug(brand);
          const slugTaken = await db.brand.findUnique({ where: { slug } });
          if (slugTaken) slug = `${slug}-${Date.now()}`;
          const created = await db.brand.create({ data: { name: brand, slug } });
          existing = { id: created.id, name: created.name, slug: created.slug };
          brandMap.set(brand.toLowerCase(), existing);
        }
        brandId = existing.id;
      }

      const productPrice = parseCurrency(price);
      const categoryId = fallbackCategory.id;

      // ── Create or update product ────────────────────────────────────────
      const existingProduct = await db.product.findUnique({ where: { sku: reference } });
      let targetProductId: string;

      if (existingProduct) {
        if (duplicateMode === 'skip') {
          result.skipped++;
          continue;
        }
        // duplicateMode === 'update'
        await db.product.update({
          where: { id: existingProduct.id },
          data: {
            name,
            shortDescription,
            description,
            categoryId,
            brandId,
            price: productPrice,
            ...(image && {
              images: {
                deleteMany: {},
                create: [{ imagePath: image, isPrimary: true, sortOrder: 0 }],
              },
            }),
          },
        });
        targetProductId = existingProduct.id;
        result.updated++;
      } else {
        let slug = toSlug(name);
        const slugTaken = await db.product.findUnique({ where: { slug } });
        if (slugTaken) slug = `${slug}-${Date.now()}`;

        const created = await db.product.create({
          data: {
            name,
            slug,
            sku: reference,
            shortDescription,
            description,
            categoryId,
            brandId,
            price: productPrice,
            ...(image && {
              images: {
                create: [{ imagePath: image, isPrimary: true, sortOrder: 0 }],
              },
            }),
          },
        });
        targetProductId = created.id;
        result.created++;
      }

      // ── Upsert variants ────────────────────────────────────────────────
      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi];
        if (!v.name) continue;
        const normalizedName = normalizeVariantName(v.name);
        if (!normalizedName) continue;

        const variantPrice = parseCurrency(v.price) ?? productPrice;
        await db.productVariant.upsert({
          where: {
            productId_normalizedName: {
              productId: targetProductId,
              normalizedName,
            },
          },
          update: {
            name: v.name,
            code: v.code || null,
            price: variantPrice,
            stockStatus: 'disponible',
            isActive: true,
          },
          create: {
            productId: targetProductId,
            name: v.name,
            code: v.code || null,
            normalizedName,
            price: variantPrice,
            stockStatus: 'disponible',
            sortOrder: vi,
          },
        });
      }

      processed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      result.errors.push(`Ref ${group.reference}: ${msg}`);
    }
  }

  return NextResponse.json({ success: true, data: { ...result, processed } });
}
