import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/categories/[slug] - Get category with products
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

    // Find category
    const category = await db.category.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Get all descendant category IDs for filtering
    const getCategoryIds = async (parentId: string): Promise<string[]> => {
      const children = await db.category.findMany({
        where: { parentId, isActive: true },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      const descendantIds = await Promise.all(
        childIds.map((id) => getCategoryIds(id))
      );
      return [parentId, ...childIds, ...descendantIds.flat()];
    };

    const categoryIds = await getCategoryIds(category.id);

    // Get products in category and subcategories
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
        },
        include: {
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.product.count({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        category,
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
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la categoría' },
      { status: 500 }
    );
  }
}
