import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upsertCart, upsertActiveCart } from "@/lib/order-cart-upsert";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      items, 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerCompany, 
      cityId, 
      notes,
      action = "save" // "save" | "add" | "update" | "remove"
    } = body;

    // Obtener sessionId del header (viene del middleware)
    const sessionId = request.headers.get("x-session-id");
    
    // TODO: Obtener userId si está autenticado (desde sesión/token)
    const userId: string | null = null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "El carrito debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Calcular subtotal
    let subtotal = 0;
    for (const item of items) {
      if (item.unitPrice) subtotal += item.unitPrice * item.quantity;
    }

    // Obtener o crear carrito activo
    let cart = await upsertActiveCart(sessionId, userId, cityId);

    // Eliminar items anteriores (para una limpieza completa) o actualizar según action
    if (action === "save") {
      // Reemplazar todos los items
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Crear nuevos items
      await db.cartItem.createMany({
        data: items.map((item: { productId: string; quantity: number; unitPrice?: number }) => ({
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || null,
        })),
      });
    } else if (action === "add") {
      // Agregar items (sin eliminar anteriores)
      const itemsToAdd = items.filter((newItem: any) => {
        const exists = cart.items?.some((existing) => existing.productId === newItem.productId);
        return !exists;
      });

      if (itemsToAdd.length > 0) {
        await db.cartItem.createMany({
          data: itemsToAdd.map((item: { productId: string; quantity: number; unitPrice?: number }) => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || null,
          })),
        });
      }

      // Actualizar cantidades de items existentes
      for (const item of items) {
        const existing = cart.items?.find((ci) => ci.productId === item.productId);
        if (existing && existing.quantity !== item.quantity) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: item.quantity },
          });
        }
      }
    } else if (action === "update") {
      // Actualizar items específicos sin eliminar
      for (const item of items) {
        const existing = cart.items?.find((ci) => ci.productId === item.productId);
        if (existing) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: item.quantity,
              unitPrice: item.unitPrice || null,
            },
          });
        }
      }
    }

    // Actualizar datos del carrito
    cart = await db.cart.update({
      where: { id: cart.id },
      data: {
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerCompany: customerCompany || undefined,
        notes: notes || undefined,
        subtotal,
        updatedAt: new Date(),
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      data: { 
        id: cart.id, 
        uuid: cart.uuid,
        itemCount: cart.items.length,
        subtotal: cart.subtotal,
      },
      message: "Carrito actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error managing cart:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar el carrito" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    const userId: string | null = null; // TODO: Obtener de sesión autenticada
    const cartUuid = request.nextUrl.searchParams.get("uuid");
    const cartId = request.nextUrl.searchParams.get("id");

    let cart = null;

    // Obtener por UUID (puede ser un carrito compartido)
    if (cartUuid) {
      cart = await db.cart.findUnique({
        where: { uuid: cartUuid },
        include: { items: { include: { product: true } } },
      });
    }
    // Obtener por ID
    else if (cartId) {
      cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true } } },
      });
    }
    // Obtener carrito activo de la sesión/usuario
    else {
      cart = await db.cart.findFirst({
        where: {
          OR: [
            { sessionId, status: 'activo' },
            { userId, status: 'activo' },
          ],
        },
        include: { items: { include: { product: true } } },
      });
    }

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Carrito no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el carrito" },
      { status: 500 }
    );
  }
}
