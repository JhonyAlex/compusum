import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendToWebhook, buildWebhookPayload } from "@/lib/webhook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, customerName, customerEmail, customerPhone, customerCompany, cityId, notes, sentVia } = body;

    if (!cartId || !customerName) {
      return NextResponse.json(
        { success: false, error: "Se requiere cartId y nombre del cliente" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validate phone (digits, spaces, +, - only) if provided
    if (customerPhone && !/^[\d\s+\-()]{7,20}$/.test(customerPhone)) {
      return NextResponse.json(
        { success: false, error: "Formato de teléfono inválido" },
        { status: 400 }
      );
    }

    // Sanitize text fields
    const safeName = customerName.trim().slice(0, 200);
    const safeCompany = customerCompany?.trim().slice(0, 200) || null;
    const safeNotes = notes?.trim().slice(0, 1000) || null;

    // Load cart with items
    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true, wholesalePrice: true, price: true } } },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ success: false, error: "Carrito no encontrado" }, { status: 404 });
    }

    // Calculate subtotal from cart items
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.unitPrice || item.product.wholesalePrice || item.product.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // Use a transaction to prevent race conditions in order number generation
    const order = await db.$transaction(async (tx) => {
      // Generate order number: CS-YYYYMMDD-XXXX (inside transaction for atomicity)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.order.count({
        where: { orderNumber: { startsWith: `CS-${today}` } },
      });
      const orderNumber = `CS-${today}-${String(countToday + 1).padStart(4, "0")}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          cartId,
          customerName: safeName,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerCompany: safeCompany,
          cityId: cityId || null,
          notes: safeNotes,
          subtotal,
          sentVia: sentVia || null,
          status: "solicitado",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.product.wholesalePrice || item.product.price,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "solicitado",
              changedBy: "sistema",
              note: "Pedido creado",
            },
          },
        },
        include: { items: true },
      });

      // Update cart status inside same transaction
      await tx.cart.update({
        where: { id: cartId },
        data: { status: "convertido" },
      });

      return newOrder;
    });

    // Always try sending to webhook (if configured in admin settings)
    const webhookPayload = await buildWebhookPayload(order.id);
    if (webhookPayload) {
      const webhookResult = await sendToWebhook(webhookPayload);

      await db.order.update({
        where: { id: order.id },
        data: {
          webhookSent: webhookResult.success,
          webhookResponse: webhookResult.response?.slice(0, 500),
          ...(webhookResult.success ? { status: "compartido" } : {}),
        },
      });

      if (webhookResult.success) {
        await db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "solicitado",
            toStatus: "compartido",
            changedBy: "sistema",
            note: `Pedido enviado via webhook${sentVia ? ` (${sentVia})` : ""}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: order.id, orderNumber: order.orderNumber },
      message: "Pedido creado exitosamente",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el pedido" },
      { status: 500 }
    );
  }
}
