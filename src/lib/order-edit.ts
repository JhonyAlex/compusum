import { db } from "./db";
import { normalizeEmail, normalizePhone, type SessionUserRef } from "./checkout";
import { validateAndPriceItems, CartValidationError } from "./cart-validation";
import { resolveServerPricingCustomer } from "./pricing";
import {
  authorizeOrderAccess,
  OrderAccessError,
  type OrderViewer,
} from "./order-access";
import { isCustomerEditableStatus, isValidRequestType } from "./order-status";

/**
 * "EDITAR PEDIDO" (Fase 3) — distinto de "Volver a pedir".
 *
 * Solo un pedido EXPLÍCITO (orderId en la URL), SOLO mientras su estado lo
 * permita ('solicitado'), con propiedad validada server-side y precios
 * re-resueltos por el motor único. Nunca se busca "cualquier solicitado del
 * cliente" para decidir qué editar. Un pedido en 'compartido' o 'recibido'
 * no altera sus items históricos desde el portal cliente.
 *
 * Toda actualización queda auditada en OrderStatusHistory (from = to = estado,
 * changedBy 'cliente', nota descriptiva); el historial previo se conserva.
 */

export class OrderEditError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrderEditError";
    this.status = status;
  }
}

export interface EditCustomerOrderInput {
  orderId: string;
  viewer: OrderViewer;
  sessionUser: SessionUserRef | null;
  sessionId: string | null;
  body: {
    items?: unknown;
    requestType?: unknown;
    customerName?: unknown;
    customerEmail?: unknown;
    customerPhone?: unknown;
    customerCompany?: unknown;
    cityId?: unknown;
    notes?: unknown;
  };
}

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function editCustomerOrder(input: EditCustomerOrderInput) {
  const { orderId, viewer, sessionUser, sessionId, body } = input;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new OrderAccessError("Pedido no encontrado", 404);
  }

  authorizeOrderAccess(order, viewer);

  if (!isCustomerEditableStatus(order.status)) {
    throw new OrderEditError(
      `Un pedido en estado "${order.status}" ya no puede editarse desde el portal. Usá "Volver a pedir".`,
      409
    );
  }

  const updateData: Record<string, unknown> = {};

  // ---- Líneas: reemplazo completo re-validado (precios/stock actuales).
  if (body.items !== undefined) {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new OrderEditError(
        "El pedido debe conservar al menos un producto. Para cancelarlo contactá a tu asesor.",
        400
      );
    }

    for (const item of body.items) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof (item as any).productId !== "string" ||
        !Number.isInteger((item as any).quantity) ||
        (item as any).quantity <= 0
      ) {
        throw new OrderEditError("Formato de items inválido", 400);
      }
    }

    // El requestType efectivo: el explícito del body o el del pedido. Cambiar
    // pedido<->cotizacion es permitido si el body lo pide explícitamente.
    const requestType = isValidRequestType(body.requestType)
      ? body.requestType
      : isValidRequestType(order.requestType)
      ? order.requestType
      : "pedido";

    // Motor único: contexto del VISOR cliente (invitado => precio base).
    const pricingCustomerId = await resolveServerPricingCustomer(sessionUser, null);

    let validatedResult;
    try {
      validatedResult = await validateAndPriceItems(
        (body.items as any[]).map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
        db,
        { customerId: pricingCustomerId, requestType }
      );
    } catch (err) {
      if (err instanceof CartValidationError) {
        throw new OrderEditError(err.message, 400);
      }
      throw err;
    }

    await db.orderItem.deleteMany({ where: { orderId: order.id } });
    await db.orderItem.createMany({
      data: validatedResult.validatedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        variantId: item.variantId,
        variantName: item.variantName,
        variantCode: item.variantCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    updateData.subtotal = validatedResult.subtotal;
    updateData.requestType = requestType;
  } else if (isValidRequestType(body.requestType)) {
    updateData.requestType = body.requestType;
  }

  // ---- Metadata de contacto/logística.
  const name = text(body.customerName, 200);
  if (name !== undefined) updateData.customerName = name || order.customerName;
  if (body.customerEmail !== undefined) {
    const emailRaw = text(body.customerEmail, 200) ?? null;
    const email = normalizeEmail(emailRaw);
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      throw new OrderEditError("Formato de email inválido", 400);
    }
    updateData.customerEmail = email;
  }
  if (body.customerPhone !== undefined) {
    const phone = normalizePhone(text(body.customerPhone, 32) ?? null);
    updateData.customerPhone = phone;
  }
  const company = text(body.customerCompany, 200);
  if (company !== undefined) updateData.customerCompany = company;
  const cityId = text(body.cityId, 64);
  if (cityId !== undefined) updateData.cityId = cityId;
  const notes = text(body.notes, 1000);
  if (notes !== undefined) updateData.notes = notes;

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: order.id },
      data: { ...updateData, updatedAt: new Date() },
      include: { items: true },
    });

    // Auditoría de la edición (el historial previo NUNCA se borra).
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status,
        changedBy: "cliente",
        note: body.items !== undefined
          ? "Pedido editado desde el portal cliente (líneas actualizadas)"
          : "Pedido editado desde el portal cliente",
      },
    });

    return result;
  });

  return updated;
}
