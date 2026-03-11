import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isGlobalCatalogModeEnabled, resolveCatalogMode } from "@/lib/catalog-mode";

/**
 * GET /api/catalog-mode
 * Returns the global catalog mode status.
 *
 * GET /api/catalog-mode?productId=xxx
 * Returns catalog mode status for a specific product (considers product,
 * category, brand, and global settings).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productSlug = searchParams.get("slug");

    const globalEnabled = await isGlobalCatalogModeEnabled();

    // Global status only
    if (!productId && !productSlug) {
      return NextResponse.json({
        success: true,
        data: { catalogMode: globalEnabled },
      });
    }

    // Product-specific status
    const where = productId ? { id: productId } : { slug: productSlug as string };
    const product = await db.product.findUnique({
      where,
      select: {
        id: true,
        catalogMode: true,
        category: { select: { catalogMode: true } },
        brand: { select: { catalogMode: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const catalogMode = resolveCatalogMode(
      product.catalogMode,
      product.category?.catalogMode ?? false,
      product.brand?.catalogMode,
      globalEnabled
    );

    return NextResponse.json({
      success: true,
      data: {
        catalogMode,
        globalCatalogMode: globalEnabled,
        productCatalogMode: product.catalogMode,
        categoryCatalogMode: product.category?.catalogMode ?? false,
        brandCatalogMode: product.brand?.catalogMode ?? false,
      },
    });
  } catch (error) {
    console.error("Error checking catalog mode:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar modo catálogo" },
      { status: 500 }
    );
  }
}
