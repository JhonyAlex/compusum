import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/seasons - List all seasons
export async function GET() {
  try {
    const seasons = await db.season.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include productCount
    const seasonsWithCount = seasons.map((season) => ({
      id: season.id,
      name: season.name,
      slug: season.slug,
      description: season.description,
      image: season.image,
      startDate: season.startDate,
      endDate: season.endDate,
      colorHex: season.colorHex,
      productCount: season._count.products,
    }));

    return NextResponse.json({
      success: true,
      data: seasonsWithCount,
    });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las temporadas' },
      { status: 500 }
    );
  }
}
