import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const routes = await db.shippingRoute.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        cities: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    console.error("Error fetching shipping routes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener rutas de envío" },
      { status: 500 }
    );
  }
}
