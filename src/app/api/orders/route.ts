import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendToWebhook, buildWebhookPayload } from "@/lib/webhook";
import { findBestRouteForCity, normalizeEmail, normalizePhone, upsertCheckoutCustomer } from "@/lib/checkout";
import { upsertOrder, findActiveOrder } from "@/lib/order-cart-upsert";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, customerName, customerEmail, customerPhone, customerCompany, cityId, notes, sentVia } = body;

    if (!cartId) {
      return NextResponse.json(
        { success: false, error: "Se requiere cartId" },
        { status: 400 }
      );
    }

    // Obtener sessionId del header (viene del middleware)
    const sessionId = request.headers.get("x-session-id");
    
    // TODO: Obtener userId si está autenticado (desde sesión/token)
    const userId: string | null = null;

    const normalizedEmail = normalizeEmail(customerEmail);
    const normalizedPhone = normalizePhone(customerPhone);

    if (!customerName && !normalizedEmail && !normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Ingresa al menos nombre, teléfono o correo" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    if (customerPhone && !normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Formato de teléfono inválido" },
        { status: 400 }
      );
    }

    // Sanitize text fields
    const safeName = customerName?.trim().slice(0, 200) || "Cliente";
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

    // Verificar si ya existe una orden activa para esta sesión/usuario
    const existingOrder = await findActiveOrder(sessionId, userId);

    if (existingOrder) {
      // ACTUALIZAR ORDEN EXISTENTE
      const order = await db.$transaction(async (tx) => {
        const customerResult = await upsertCheckoutCustomer(
          {
            name: safeName,
            phone: normalizedPhone,
            email: normalizedEmail,
          },
          tx
        );

        const selectedRoute = await findBestRouteForCity(cityId || null, new Date(), tx);

        // Usar upsertOrder para actualizar
        const updated = await upsertOrder(
          {
            customerName: safeName,
            customerEmail: normalizedEmail,
            customerPhone: normalizedPhone,
            customerCompany: safeCompany,
            cityId: cityId || null,
            routeId: selectedRoute?.id || null,
            notes: safeNotes,
            agentId: customerResult.assignedAgentId || null,
            subtotal,
            sentVia: sentVia || null,
            items: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.product.wholesalePrice || item.product.price,
            })),
          },
          cartId,
          sessionId,
          customerResult.customer?.id || null,
          tx
        );

        return updated;
      });

      // Actualizar estado del carrito
      await db.cart.update({
        where: { id: cartId },
        data: { status: "convertido" },
      });

      // Intentar enviar a webhook (si cambiaron datos de contacto o monto)
      const webhookPayload = await buildWebhookPayload(order.id);
      if (webhookPayload && !order.webhookSent) {
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
              note: `Pedido actualizado y enviado via webhook${sentVia ? ` (${sentVia})` : ""}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: { id: order.id, orderNumber: order.orderNumber, isUpdate: true },
        message: "Pedido actualizado exitosamente",
      });
    }

    // CREAR NUEVA ORDEN
    const newOrder = await db.$transaction(async (tx) => {
      const customerResult = await upsertCheckoutCustomer(
        {
          name: safeName,
          phone: normalizedPhone,
          email: normalizedEmail,
        },
        tx
      );

      const selectedRoute = await findBestRouteForCity(cityId || null, new Date(), tx);

      // Generate order number: CS-YYYYMMDD-XXXX (inside transaction for atomicity)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.order.count({
        where: { orderNumber: { startsWith: `CS-${today}` } },
      });
      const orderNumber = `CS-${today}-${String(countToday + 1).padStart(4, "0")}`;

      const created = await upsertOrder(
        {
          orderNumber,
          customerName: safeName,
          customerEmail: normalizedEmail,
          customerPhone: normalizedPhone,
          customerCompany: safeCompany,
          cityId: cityId || null,
          routeId: selectedRoute?.id || null,
          notes: safeNotes,
          agentId: customerResult.assignedAgentId || null,
          subtotal,
          sentVia: sentVia || null,
          items: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.product.wholesalePrice || item.product.price,
          })),
        },
        cartId,
        sessionId,
        customerResult.customer?.id || null,
        tx
      );

      // Crear historial de estado
      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: "solicitado",
          changedBy: "sistema",
          note: "Pedido creado desde carrito",
        },
      });

      // Update cart status inside same transaction
      await tx.cart.update({
        where: { id: cartId },
        data: { status: "convertido" },
      });

      return created;
    });

    // Always try sending to webhook (if configured in admin settings)
    const webhookPayload = await buildWebhookPayload(newOrder.id);
    if (webhookPayload) {
      const webhookResult = await sendToWebhook(webhookPayload);

      await db.order.update({
        where: { id: newOrder.id },
        data: {
          webhookSent: webhookResult.success,
          webhookResponse: webhookResult.response?.slice(0, 500),
          ...(webhookResult.success ? { status: "compartido" } : {}),
        },
      });

      if (webhookResult.success) {
        await db.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            fromStatus: "solicitado",
            toStatus: "compartido",
            changedBy: "sistema",
            note: `Pedido creado y enviado via webhook${sentVia ? ` (${sentVia})` : ""}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: newOrder.id, orderNumber: newOrder.orderNumber, isUpdate: false },
      message: "Pedido creado exitosamente",
    });
  } catch (error) {
    console.error("Error managing order:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar el pedido" },
      { status: 500 }
    );
  }
}
