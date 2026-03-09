import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/banners - List active banners (filter by position)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const now = new Date();

    // Build filter conditions
    const where: any = {
      isActive: true,
    };

    if (position) {
      where.position = position;
    }

    // Filter banners that are within their date range
    // Note: SQLite doesn't have great date handling, so we do additional filtering in JS
    const banners = await db.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // Filter by date range
    const activeBanners = banners.filter((banner) => {
      // If no date range set, banner is always active
      if (!banner.startsAt && !banner.endsAt) return true;

      const startsAt = banner.startsAt ? new Date(banner.startsAt) : null;
      const endsAt = banner.endsAt ? new Date(banner.endsAt) : null;

      // Check if current date is within range
      if (startsAt && endsAt) {
        return now >= startsAt && now <= endsAt;
      }
      if (startsAt) {
        return now >= startsAt;
      }
      if (endsAt) {
        return now <= endsAt;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: activeBanners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los banners' },
      { status: 500 }
    );
  }
}
