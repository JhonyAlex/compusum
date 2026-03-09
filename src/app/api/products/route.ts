import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/products - List products with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const isNew = searchParams.get('new');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (brand) {
      where.brand = {
        slug: brand,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { shortDescription: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (isNew === 'true') {
      where.isNew = true;
    }

    // Get products and total count
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          seasons: {
            include: {
              season: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los productos' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product (for admin)
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
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
      metaTitle,
      metaDescription,
      images,
      seasonIds,
    } = body;

    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        sku,
        description,
        shortDescription,
        categoryId,
        brandId,
        price: price ? parseFloat(price) : null,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        minWholesaleQty: minWholesaleQty || 1,
        stockStatus: stockStatus || 'disponible',
        isFeatured: isFeatured || false,
        isNew: isNew || false,
        isActive: isActive !== undefined ? isActive : true,
        tags,
        sortOrder: sortOrder || 0,
        metaTitle,
        metaDescription,
        ...(images && images.length > 0 && {
          images: {
            create: images.map((img: any, index: number) => ({
              imagePath: img.imagePath,
              thumbnailPath: img.thumbnailPath,
              altText: img.altText,
              isPrimary: img.isPrimary || index === 0,
              sortOrder: index,
            })),
          },
        }),
        ...(seasonIds && seasonIds.length > 0 && {
          seasons: {
            create: seasonIds.map((seasonId: string) => ({
              seasonId,
            })),
          },
        }),
      },
      include: {
        category: true,
        brand: true,
        images: true,
        seasons: {
          include: {
            season: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Producto creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con este slug o SKU' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al crear el producto' },
      { status: 500 }
    );
  }
}
