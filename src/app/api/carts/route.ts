import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, customerEmail, customerPhone, customerCompany, cityId, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "El carrito debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      if (item.unitPrice) subtotal += item.unitPrice * item.quantity;
    }

    const cart = await db.cart.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        cityId: cityId || null,
        notes,
        subtotal,
        items: {
          create: items.map((item: { productId: string; quantity: number; unitPrice?: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || null,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: cart.id, uuid: cart.uuid },
      message: "Carrito guardado exitosamente",
    });
  } catch (error) {
    console.error("Error creating cart:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar el carrito" },
      { status: 500 }
    );
  }
}
