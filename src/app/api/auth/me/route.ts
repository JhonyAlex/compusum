import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// GET /api/auth/me - Get current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          data: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el usuario actual' },
      { status: 500 }
    );
  }
}
