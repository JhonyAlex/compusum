import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateAndPriceItems, CartValidationError } from "@/lib/cart-validation";
import { attachResolvedPricesToCartItems } from "@/lib/pricing";
import { getSessionPricingContext } from "@/lib/pricing-context";

interface RouteParams {
  params: Promise<{ uuid: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;

    const cart = await db.cart.findUnique({
      where: { uuid },
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
        city: {
          include: {
            department: true,
            shippingRoute: true,
          },
        },
      },
    });

    if (!cart || !cart.isActive) {
      return NextResponse.json(
        { success: false, error: "Carrito no encontrado" },
        { status: 404 }
      );
    }

    // Validar propiedad del carrito
    const sessionId = request.headers.get("x-session-id");
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? null;
    const userRole = currentUser?.role ?? null;
    const isAdminOrAgent = userRole === "admin" || userRole === "AGENT";

    const isOwner = (cart.sessionId && cart.sessionId === sessionId) || (userId && cart.userId === userId);
    const isShared = cart.status === "compartido";

    if (!isAdminOrAgent && !isShared && !isOwner) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para acceder a este carrito" },
        { status: 403 }
      );
    }

    // Motor único de precios: resolvedPrice del VISOR (sesión server-side).
    // Un invitado que abre un carrito compartido ve el precio autorizado para
    // él, no el snapshot de perfil del dueño.
    const pricingCtx = await getSessionPricingContext();
    const pricedCart = await attachResolvedPricesToCartItems(cart, pricingCtx);

    return NextResponse.json({ success: true, data: pricedCart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el carrito" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { items, customerName, customerEmail, customerPhone, customerCompany, cityId, notes } = body;

    // Validación de forma: `items` debe ser arreglo o no venir. Un arreglo
    // VACÍO es semánticamente "vaciar el carrito" (elimina items y subtotal 0).
    if (items !== undefined && items !== null && !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Formato de items inválido" },
        { status: 400 }
      );
    }

    const existingCart = await db.cart.findUnique({ where: { uuid } });
    if (!existingCart || !existingCart.isActive) {
      return NextResponse.json(
        { success: false, error: "Carrito no encontrado" },
        { status: 404 }
      );
    }

    // Validar propiedad del carrito
    const sessionId = request.headers.get("x-session-id");
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? null;
    const userRole = currentUser?.role ?? null;
    const isAdminOrAgent = userRole === "admin" || userRole === "AGENT";

    const isOwner = (existingCart.sessionId && existingCart.sessionId === sessionId) || (userId && existingCart.userId === userId);

    if (!isAdminOrAgent && !isOwner) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para modificar este carrito" },
        { status: 403 }
      );
    }

    // Only allow modification of active carts (not converted/shared/expired)
    if (existingCart.status !== "activo") {
      return NextResponse.json(
        { success: false, error: "Este carrito ya no se puede modificar" },
        { status: 403 }
      );
    }

    // Motor único de precios: el precio NUNCA se toma del navegador. Se
    // recalcula server-side con el contexto del dueño del carrito (dato del
    // servidor, no del cliente); si es un carrito de invitado, precio base.
    //
    // Semántica de `items`:
    //   - undefined/null  => actualización SOLO de metadata: se conservan los
    //     items Y el subtotal existente (no repreciar, no tocar líneas).
    //   - []              => VACIAR el carrito: elimina TODOS los items y
    //     subtotal 0.
    //   - [...]           => validar y repreciar server-side; reemplazar
    //     items y subtotal con el resultado validado.
    // El subtotal SOLO se escribe cuando `items` viene en el body: un PUT de
    // solo notas nunca puede dejar líneas con subtotal 0.
    const itemsProvided = Array.isArray(items);
    let validatedResult: Awaited<ReturnType<typeof validateAndPriceItems>> | undefined;
    if (itemsProvided && items.length > 0) {
      let ownerPricingCustomerId: string | null = null;
      if (existingCart.userId) {
        const owner = await db.user.findUnique({
          where: { id: existingCart.userId },
          select: { id: true, role: true },
        });
        if (owner && owner.role.toLowerCase() === "customer") {
          ownerPricingCustomerId = owner.id;
        }
      }

      try {
        validatedResult = await validateAndPriceItems(
          items.map((item: { productId: string; variantId?: string | null; quantity: number }) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
          })),
          db,
          { customerId: ownerPricingCustomerId }
        );
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
      where: { uuid },
      data: {
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        cityId: cityId || null,
        notes,
        subtotal: itemsProvided ? (validatedResult?.subtotal ?? 0) : existingCart.subtotal,
        ...(itemsProvided
          ? {
              items: {
                deleteMany: {},
                create:
                  validatedResult?.validatedItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    variantName: item.variantName,
                    variantCode: item.variantCode,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                  })) ?? [],
              },
            }
          : {}),
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: cart.id, uuid: cart.uuid },
      message: "Carrito actualizado",
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el carrito" },
      { status: 500 }
    );
  }
}
