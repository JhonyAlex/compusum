import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/brands - Create a new brand
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description, logo, website, sortOrder, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingBrand = await db.brand.findUnique({
      where: { slug },
    });

    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: "Ya existe una marca con ese slug" },
        { status: 400 }
      );
    }

    const brand = await db.brand.create({
      data: {
        name,
        slug,
        description: description || null,
        logo: logo || null,
        website: website || null,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: brand,
      message: "Marca creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la marca" },
      { status: 500 }
    );
  }
}
