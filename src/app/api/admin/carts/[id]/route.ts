import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { validateAndPriceItems, CartValidationError } from "@/lib/cart-validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;

    const cart = await db.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { name: true, slug: true } },
                category: { select: { name: true, slug: true } },
              },
            },
          },
        },
        city: { include: { department: true, shippingRoute: true } },
        orders: { select: { id: true, orderNumber: true, status: true, createdAt: true } },
      },
    });

    if (!cart) {
      return NextResponse.json({ success: false, error: "Carrito no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ success: false, error: "Error al obtener carrito" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { isActive, status, customerName, customerEmail, customerPhone, customerCompany, cityId, notes, items } = body;

    const data: Record<string, unknown> = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (status) data.status = status;
    if (customerName !== undefined) data.customerName = customerName || null;
    if (customerEmail !== undefined) data.customerEmail = customerEmail || null;
    if (customerPhone !== undefined) data.customerPhone = customerPhone || null;
    if (customerCompany !== undefined) data.customerCompany = customerCompany || null;
    if (cityId !== undefined) data.cityId = cityId || null;
    if (notes !== undefined) data.notes = notes || null;

    if (items && Array.isArray(items)) {
      // Motor único de precios: el precio se resuelve server-side (perfil del
      // dueño del carrito o precio base). El navegador no decide precios, ni
      // siquiera en administración; la edición monetaria de pedidos se hace
      // explícitamente en el PATCH del pedido.
      const targetCart = await db.cart.findUnique({
        where: { id },
        select: { userId: true },
      });

      let ownerPricingCustomerId: string | null = null;
      if (targetCart?.userId) {
        const owner = await db.user.findUnique({
          where: { id: targetCart.userId },
          select: { id: true, role: true },
        });
        if (owner && owner.role.toLowerCase() === "customer") {
          ownerPricingCustomerId = owner.id;
        }
      }

      try {
        const { validatedItems, subtotal } = await validateAndPriceItems(
          items.map((item: { productId: string; variantId?: string | null; quantity: number }) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
          })),
          db,
          { customerId: ownerPricingCustomerId }
        );
        data.subtotal = subtotal;

        const cart = await db.$transaction(async (tx) => {
          await tx.cartItem.deleteMany({ where: { cartId: id } });
          return tx.cart.update({
            where: { id },
            data: {
              ...data,
              items: {
                create: validatedItems.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  variantName: item.variantName,
                  variantCode: item.variantCode,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            },
            include: { items: true },
          });
        });

        return NextResponse.json({ success: true, data: cart, message: "Carrito actualizado" });
      } catch (err) {
        if (err instanceof CartValidationError) {
          return NextResponse.json(
            { success: false, error: err.message },
            { status: 400 }
          );
        }
        throw err;
      }
    }

    const cart = await db.cart.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: cart,
      message: "Carrito actualizado",
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ success: false, error: "Error al actualizar carrito" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;

    const cart = await db.cart.findUnique({
      where: { id },
      include: { orders: { select: { id: true } } },
    });

    if (!cart) {
      return NextResponse.json({ success: false, error: "Carrito no encontrado" }, { status: 404 });
    }

    if (cart.orders.length > 0) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar un carrito con pedidos asociados" },
        { status: 400 }
      );
    }

    await db.cart.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Carrito eliminado" });
  } catch (error) {
    console.error("Error deleting cart:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar carrito" }, { status: 500 });
  }
}
