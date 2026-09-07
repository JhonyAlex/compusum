import { getCurrentUser } from "./auth";
import type { PricingCustomerContext } from "./pricing";

/**
 * Contexto del motor de precios derivado EXCLUSIVAMENTE de la sesión
 * autenticada server-side (cookie de sesión). Nunca de datos del navegador.
 *
 * - Cliente autenticado (rol CUSTOMER) => su cuenta resuelve el precio.
 * - ADMIN/AGENT o invitado => precio base/default (para ADMIN/AGENT que
 *   venden asistiendo a un cliente, el precio del cliente se resuelve vía
 *   `resolveServerPricingCustomer` con el contacto del pedido, autorizado
 *   server-side).
 */
export async function getSessionPricingContext(): Promise<
  PricingCustomerContext & { user: Awaited<ReturnType<typeof getCurrentUser>> }
> {
  const user = await getCurrentUser();
  const customerId =
    user && user.role?.toLowerCase() === "customer" ? user.id : null;
  return { customerId, user };
}
