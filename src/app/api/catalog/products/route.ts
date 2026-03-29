import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isGlobalCatalogModeEnabled } from '@/lib/catalog-mode';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);
    const skip = (page - 1) * limit;

    const isCatalogMode = await isGlobalCatalogModeEnabled();

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
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
          category: { select: { id: true, name: true, slug: true, catalogMode: true } },
          brand: { select: { id: true, name: true, slug: true, catalogMode: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { imagePath: true, thumbnailPath: true, altText: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.product.count({ where: { isActive: true } }),
    ]);

    const formattedProducts = products.map(product => {
      const productCatalogMode =
        product.catalogMode ||
        product.category?.catalogMode ||
        product.brand?.catalogMode ||
        isCatalogMode;

      return {
        ...product,
        price: productCatalogMode ? null : product.price,
        wholesalePrice: productCatalogMode ? null : product.wholesalePrice,
      };
    });

    return NextResponse.json({
      data: formattedProducts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
