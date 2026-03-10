import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const cart = await db.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { name: true, slug: true } },
                category: { select: { name: true, slug: true } },
              },
            },
          },
        },
        city: { include: { department: true, shippingRoute: true } },
        orders: { select: { id: true, orderNumber: true, status: true, createdAt: true } },
      },
    });

    if (!cart) {
      return NextResponse.json({ success: false, error: "Carrito no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ success: false, error: "Error al obtener carrito" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, status } = body;

    const data: Record<string, unknown> = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (status) data.status = status;

    const cart = await db.cart.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: cart,
      message: "Carrito actualizado",
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar carrito" }, { status: 500 });
  }
}
