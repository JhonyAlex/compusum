import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Validate API key from N8N
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.N8N_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderNumber, orderId, status: responseStatus } = body;

    // Find the order by orderNumber or orderId
    const order = await db.order.findFirst({
      where: orderId ? { id: orderId } : { orderNumber },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Only allow valid status transitions from N8N
    const allowedStatuses = ["recibido"];
    const newStatus = allowedStatuses.includes(responseStatus) ? responseStatus : "recibido";

    await db.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        webhookResponse: JSON.stringify(body).slice(0, 500),
      },
    });

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: "n8n-webhook",
        note: `Confirmación recibida: ${responseStatus || "Recibido"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Estado actualizado",
    });
  } catch (error) {
    console.error("Error processing N8N webhook:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
