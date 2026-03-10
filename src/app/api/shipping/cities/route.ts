import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department");

    const departments = await db.department.findMany({
      where: {
        isActive: true,
        ...(departmentCode ? { code: departmentCode } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            shippingRoute: {
              select: {
                id: true,
                name: true,
                estimatedDaysMin: true,
                estimatedDaysMax: true,
                shippingCompany: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener ciudades" },
      { status: 500 }
    );
  }
}
