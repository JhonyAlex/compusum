import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/categories - Create a new category
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
    const { name, slug, description, image, icon, sortOrder, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await db.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "Ya existe una categoría con ese slug" },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        icon: icon || null,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: "Categoría creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}
