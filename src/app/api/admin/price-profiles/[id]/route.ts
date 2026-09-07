import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import {
  getPriceProfile,
  updatePriceProfile,
  deletePriceProfile,
  PriceProfileAdminError,
} from "@/lib/price-profiles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    const profile = await getPriceProfile(id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Perfil de precio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    console.error("Error fetching price profile:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener el perfil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const profile = await updatePriceProfile(id, body);

    return NextResponse.json({
      success: true,
      data: profile,
      message: "Perfil actualizado",
    });
  } catch (err) {
    if (err instanceof PriceProfileAdminError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "CODE_EXISTS" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status }
      );
    }
    console.error("Error updating price profile:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el perfil" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    const result = await deletePriceProfile(id);

    return NextResponse.json({
      success: true,
      message: `Perfil eliminado. ${result.assignedUsers} cliente(s) quedaron sin perfil (precio base).`,
    });
  } catch (err) {
    if (err instanceof PriceProfileAdminError) {
      const status = err.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status }
      );
    }
    console.error("Error deleting price profile:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el perfil" },
      { status: 500 }
    );
  }
}
