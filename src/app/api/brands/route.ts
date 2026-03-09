import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/brands - List all active brands
export async function GET() {
  try {
    const brands = await db.brand.findMany({
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
    const brandsWithCount = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logo: brand.logo,
      website: brand.website,
      productCount: brand._count.products,
    }));

    return NextResponse.json({
      success: true,
      data: brandsWithCount,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las marcas' },
      { status: 500 }
    );
  }
}
