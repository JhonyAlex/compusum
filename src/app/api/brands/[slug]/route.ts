import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isGlobalCatalogModeEnabled, sanitizeProductsForCatalog } from '@/lib/catalog-mode';
import { attachResolvedPrices } from '@/lib/pricing';
import { getSessionPricingContext } from '@/lib/pricing-context';

// GET /api/brands/[slug] - Get brand with products
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Find brand
    const brand = await db.brand.findUnique({
      where: {
        slug,
        isActive: true,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Marca no encontrada' },
        { status: 404 }
      );
    }

    // Get products by brand
    const [isCatalogMode, [products, total]] = await Promise.all([
      isGlobalCatalogModeEnabled(),
      Promise.all([
        db.product.findMany({
          where: {
            brandId: brand.id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true,
            wholesalePrice: true,
            minWholesaleQty: true,
            stockStatus: true,
            isFeatured: true,
            isNew: true,
            catalogMode: true,
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
        db.product.count({
          where: {
            brandId: brand.id,
            isActive: true,
          },
        }),
      ]),
    ]);

    // Motor único de precios: resolvedPrice por sesión (batch, sin N+1)
    const pricingCtx = await getSessionPricingContext();
    const pricedProducts = await attachResolvedPrices(
      sanitizeProductsForCatalog(products, isCatalogMode),
      pricingCtx
    );

    return NextResponse.json({
      success: true,
      data: {
        brand,
        products: pricedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la marca' },
      { status: 500 }
    );
  }
}
