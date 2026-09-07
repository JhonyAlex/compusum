import { NextRequest } from "next/server";
import { getCurrentUser, isAdminRole } from "./auth";

/**
 * Autorización del portal cliente para pedidos (Fase 3).
 *
 * - CUSTOMER autenticado: SOLO pedidos donde customerId === sesión.
 * - Invitado: SOLO si el pedido pertenece exactamente a su x-session-id
 *   (header server-side del middleware, no dato del navegador).
 * - ADMIN (admin/editor): acceso autorizado conservado.
 * - AGENT: SIN acceso por esta vía en Fase 3 (no existe política común de
 *   portal para agentes; nunca acceso indiscriminado).
 */

export interface OrderOwnershipRef {
  customerId: string | null;
  sessionId: string | null;
}

export interface OrderViewer {
  user: { id: string; role: string } | null;
  sessionId: string | null;
}

export class OrderAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrderAccessError";
    this.status = status;
  }
}

export async function getOrderViewer(
  request: NextRequest
): Promise<OrderViewer> {
  const user = await getCurrentUser();
  return { user, sessionId: request.headers.get("x-session-id") };
}

export function authorizeOrderAccess(
  order: OrderOwnershipRef,
  viewer: OrderViewer
): void {
  const role = viewer.user?.role?.toLowerCase();

  if (role === "admin" || role === "editor") {
    return;
  }

  if (role === "customer") {
    if (order.customerId && order.customerId === viewer.user!.id) {
      return;
    }
    // Un CUSTOMER tampoco puede colarse por sessionId de invitado.
    throw new OrderAccessError("No tienes acceso a este pedido", 403);
  }

  // Invitado: match EXACTO de sessionId y pedido sin cliente asociado.
  if (
    !viewer.user &&
    viewer.sessionId &&
    order.sessionId === viewer.sessionId &&
    !order.customerId
  ) {
    return;
  }

  if (!viewer.user && !viewer.sessionId) {
    throw new OrderAccessError("Sesión no válida", 401);
  }

  throw new OrderAccessError("No tienes acceso a este pedido", 403);
}

export function isOrderAdminViewer(viewer: OrderViewer): boolean {
  return isAdminRole(viewer.user?.role);
}
