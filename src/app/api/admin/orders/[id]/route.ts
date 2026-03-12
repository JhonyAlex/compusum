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

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        cart: { select: { uuid: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ success: false, error: "Error al obtener pedido" }, { status: 500 });
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
    const { status, note } = body;

    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const updated = await db.order.update({
      where: { id },
      data: { 
        status,
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    await db.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        changedBy: user.name || "admin",
        note: note || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Estado actualizado",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar pedido" }, { status: 500 });
  }
}
