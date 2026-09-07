import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { createPriceProfile, PriceProfileAdminError } from "@/lib/price-profiles";

// GET /api/admin/price-profiles
export async function GET() {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const profiles = await db.priceProfile.findMany({
      include: {
        _count: { select: { users: true, productOverrides: true, variantOverrides: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: profiles });
  } catch (err) {
    console.error("Error listing price profiles:", err);
    return NextResponse.json(
      { success: false, error: "Error al listar perfiles de precio" },
      { status: 500 }
    );
  }
}

// POST /api/admin/price-profiles
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const body = await request.json();
    const profile = await createPriceProfile(body);

    return NextResponse.json(
      { success: true, data: profile, message: "Perfil de precio creado" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PriceProfileAdminError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "CODE_EXISTS" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status }
      );
    }
    console.error("Error creating price profile:", err);
    return NextResponse.json(
      { success: false, error: "Error al crear el perfil de precio" },
      { status: 500 }
    );
  }
}
