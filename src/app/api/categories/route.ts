import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to build category tree
function buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
  return categories
    .filter((cat) => cat.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

// GET /api/categories - List all categories in tree structure
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Transform to include productCount
    const categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      productCount: cat._count.products,
    }));

    // Build tree structure
    const categoryTree = buildCategoryTree(categoriesWithCount);

    return NextResponse.json({
      success: true,
      data: categoryTree,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las categorías' },
      { status: 500 }
    );
  }
}
