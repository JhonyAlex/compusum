import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isGlobalCatalogModeEnabled } from '@/lib/catalog-mode';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        brand: true,
        images: true,
      }
    });

    const isCatalogMode = await isGlobalCatalogModeEnabled();

    const formattedProducts = products.map(product => {
      // Determine individual catalog mode by rules
      const productCatalogMode =
         product.catalogMode ||
         product.category?.catalogMode ||
         product.brand?.catalogMode ||
         isCatalogMode;

      return {
        ...product,
        // Scrub prices if catalog mode is active for this product
        price: productCatalogMode ? null : product.price,
        wholesalePrice: productCatalogMode ? null : product.wholesalePrice,
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
