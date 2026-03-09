import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/products - Create a new product
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      sku,
      description,
      shortDescription,
      categoryId,
      brandId,
      price,
      wholesalePrice,
      minWholesaleQty,
      stockStatus,
      isFeatured,
      isNew,
      isActive,
      tags,
      sortOrder,
      images,
    } = body;

    if (!name || !slug || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Nombre, slug y categoría son requeridos" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "Ya existe un producto con ese slug" },
        { status: 400 }
      );
    }

    // Check if SKU already exists (if provided)
    if (sku) {
      const existingSku = await db.product.findUnique({
        where: { sku },
      });

      if (existingSku) {
        return NextResponse.json(
          { success: false, error: "Ya existe un producto con ese SKU" },
          { status: 400 }
        );
      }
    }

    // Create product with images
    const product = await db.product.create({
      data: {
        name,
        slug,
        sku: sku || null,
        description: description || null,
        shortDescription: shortDescription || null,
        categoryId,
        brandId: brandId || null,
        price: price ? parseFloat(price) : null,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        minWholesaleQty: minWholesaleQty || 1,
        stockStatus: stockStatus || "disponible",
        isFeatured: isFeatured ?? false,
        isNew: isNew ?? false,
        isActive: isActive ?? true,
        tags: tags || null,
        sortOrder: sortOrder || 0,
        // Create images if provided
        ...(images && images.length > 0 && {
          images: {
            create: images.map((img: { imagePath: string; isPrimary: boolean }, index: number) => ({
              imagePath: img.imagePath,
              isPrimary: img.isPrimary,
              sortOrder: index,
            })),
          },
        }),
      },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: "Producto creado exitosamente",
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Ya existe un producto con ese slug o SKU" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
