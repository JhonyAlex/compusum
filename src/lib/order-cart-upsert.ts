/**
 * Helpers para gestionar carritos con lógica de upsert
 * basada en session_id para usuarios invitados y user_id para usuarios logueados.
 *
 * Fase 3: las órdenes ya NO se gestionan con upsert por sesión/cuenta.
 * Cada checkout crea un Order nuevo (snapshot histórico) — ver
 * `src/lib/order-create.ts` para la semántica y la protección de doble submit.
 */

import { db } from './db';

/**
 * Obtiene o crea un carrito activo basado en sessionId o userId
 * @param sessionId - Session ID del navegador (para usuarios invitados)
 * @param userId - User ID (para usuarios logueados)
 * @param cityId - City ID opcional
 * @returns El carrito existente o uno nuevo
 */
export async function upsertActiveCart(
  sessionId: string | null | undefined,
  userId: string | null | undefined,
  cityId?: string | null
) {
  // Si no hay sessionId ni userId, crear carrito nuevo
  if (!sessionId && !userId) {
    return await db.cart.create({
      data: {
        status: 'activo',
        cityId: cityId || null,
      },
      include: { items: true },
    });
  }

  // Buscar carrito activo existente
  if (sessionId) {
    const existingCart = await db.cart.findFirst({
      where: {
        sessionId,
        status: 'activo',
      },
      include: { items: true },
    });

    if (existingCart) {
      return existingCart;
    }

    // Crear carrito para esta sesión
    try {
      return await db.cart.create({
        data: {
          sessionId,
          status: 'activo',
          cityId: cityId || null,
        },
        include: { items: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Race condition: another concurrent request already created this cart
        return await db.cart.findFirstOrThrow({
          where: { sessionId, status: 'activo' },
          include: { items: true },
        });
      }
      throw e;
    }
  }

  if (userId) {
    const existingCart = await db.cart.findFirst({
      where: {
        userId,
        status: 'activo',
      },
      include: { items: true },
    });

    if (existingCart) {
      return existingCart;
    }

    // Crear carrito para este usuario
    try {
      return await db.cart.create({
        data: {
          userId,
          status: 'activo',
          cityId: cityId || null,
        },
        include: { items: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Race condition: another concurrent request already created this cart
        return await db.cart.findFirstOrThrow({
          where: { userId, status: 'activo' },
          include: { items: true },
        });
      }
      throw e;
    }
  }

  // Fallback
  return await db.cart.create({
    data: {
      status: 'activo',
      cityId: cityId || null,
    },
    include: { items: true },
  });
}

/**
 * Actualiza un carrito existente o crea uno nuevo (upsert)
 * @param cartData - Datos del carrito
 * @param sessionId - Session ID del navegador
 * @param userId - User ID opcional
 * @returns El carrito actualizado o creado
 */
export async function upsertCart(
  cartData: {
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    customerCompany?: string | null;
    cityId?: string | null;
    notes?: string | null;
    subtotal?: number;
  },
  sessionId: string | null | undefined,
  userId: string | null | undefined = null
) {
  // Si hay sessionId, intentar upsert basado en sesión
  if (sessionId) {
    // Buscar carrito activo existente para esta sesión
    const existingCart = await db.cart.findFirst({
      where: {
        sessionId,
        status: 'activo',
      },
    });

    if (existingCart) {
      // Actualizar carrito existente
      return await db.cart.update({
        where: { id: existingCart.id },
        data: {
          ...cartData,
          updatedAt: new Date(),
        },
        include: { items: true },
      });
    }

    // Crear nuevo carrito
    return await db.cart.create({
      data: {
        sessionId,
        ...cartData,
        status: 'activo',
      },
      include: { items: true },
    });
  }

  // Si hay userId, intentar upsert basado en usuario
  if (userId) {
    const existingCart = await db.cart.findFirst({
      where: {
        userId,
        status: 'activo',
      },
    });

    if (existingCart) {
      return await db.cart.update({
        where: { id: existingCart.id },
        data: {
          ...cartData,
          updatedAt: new Date(),
        },
        include: { items: true },
      });
    }

    return await db.cart.create({
      data: {
        userId,
        ...cartData,
        status: 'activo',
      },
      include: { items: true },
    });
  }

  // Fallback: crear carrito sin sesión
  return await db.cart.create({
    data: {
      ...cartData,
      status: 'activo',
    },
    include: { items: true },
  });
}

/**
 * Transfiere un carrito de sesión a usuario cuando este se registra/inicia sesión
 * @param sessionId - Session ID anterior (para invitados)
 * @param userId - User ID (nuevo usuario registrado/logueado)
 */
export async function transferSessionCartToUser(
  sessionId: string | null | undefined,
  userId: string
) {
  if (!sessionId) return null;

  // Encontrar carrito activo con sessionId
  const sessionCart = await db.cart.findFirst({
    where: {
      sessionId,
      status: 'activo',
    },
  });

  if (!sessionCart) return null;

  // Marcar cualquier carrito anterior del usuario como expirado para evitar conflictos
  await db.cart.updateMany({
    where: {
      userId,
      status: 'activo',
    },
    data: {
      status: 'expirado',
    },
  });

  // Transferir el carrito de sesión al usuario
  return await db.cart.update({
    where: { id: sessionCart.id },
    data: {
      userId,
      sessionId: null, // Desvincularlo de la sesión
      updatedAt: new Date(),
    },
    include: { items: true },
  });
}

/**
 * Transfiere una orden de sesión a usuario cuando este se registra/inicia sesión
 * @param sessionId - Session ID anterior (para invitados)
 * @param customerId - Customer ID (nuevo usuario registrado/logueado)
 */
export async function transferSessionOrderToUser(
  sessionId: string | null | undefined,
  customerId: string
) {
  if (!sessionId) return null;

  // Encontrar órdenes con sessionId
  const sessionOrders = await db.order.findMany({
    where: {
      sessionId,
    },
  });

  if (sessionOrders.length === 0) return null;

  // Transferir todas las órdenes del guest sessionId al usuario
  const orders = [];
  for (const order of sessionOrders) {
    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        customerId,
        sessionId: null,
        updatedAt: new Date(),
      },
      include: { items: true },
    });
    orders.push(updated);
  }

  return orders.length === 1 ? orders[0] : orders;
}

