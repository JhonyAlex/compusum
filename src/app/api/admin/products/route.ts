import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/products - List products with server-side pagination and filters
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const featured = searchParams.get("featured");
    const isNew = searchParams.get("new");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (brandId && brandId !== "all") where.brandId = brandId;
    if (featured === "true") where.isFeatured = true;
    if (isNew === "true") where.isNew = true;
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    const allowedSortFields: Record<string, string> = {
      createdAt: "createdAt",
      name: "name",
      price: "price",
      sortOrder: "sortOrder",
    };
    const orderField = allowedSortFields[sortBy] || "createdAt";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    const [products, total, categories, brands] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          wholesalePrice: true,
          stockStatus: true,
          isFeatured: true,
          isNew: true,
          isActive: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1, select: { imagePath: true } },
        },
        orderBy: { [orderField]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
      db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      db.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        brands,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

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
      catalogMode,
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
        catalogMode: catalogMode ?? false,
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

    // Invalidate product caches
    revalidateTag("products");
    revalidateTag("featured-products");
    revalidateTag("new-products");

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
