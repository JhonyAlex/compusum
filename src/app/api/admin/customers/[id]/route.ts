import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import {
  updateCustomerAccount,
  deleteCustomerAccount,
  CustomerAdminError,
} from "@/lib/customers-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/customers/[id] - detalle del cliente + actividad
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;

    const customer = await db.user.findFirst({
      where: { id, role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        taxId: true,
        address: true,
        city: true,
        notes: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        assignedAgent: { select: { id: true, name: true, email: true } },
        priceProfile: { select: { id: true, name: true, code: true } },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const [orders, carts, aggregates] = await Promise.all([
      db.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          createdAt: true,
          items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
        },
      }),
      db.cart.findMany({
        where: { userId: id, status: "activo" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, uuid: true, subtotal: true, updatedAt: true, _count: { select: { items: true } } },
      }),
      db.order.aggregate({
        where: { customerId: id },
        _count: { _all: true },
        _sum: { subtotal: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        customer,
        orders,
        carts,
        stats: { orderCount: aggregates._count._all, totalSpent: aggregates._sum.subtotal ?? 0 },
      },
    });
  } catch (err) {
    console.error("Error fetching customer:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener el cliente" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/customers/[id] - editar cliente / asesor / perfil / activo
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const customer = await updateCustomerAccount(id, body);

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Cliente actualizado exitosamente",
    });
  } catch (err) {
    if (err instanceof CustomerAdminError) {
      const status =
        err.code === "NOT_FOUND" ? 404 : err.code === "ACCOUNT_EXISTS" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status }
      );
    }
    console.error("Error updating customer:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el cliente" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/customers/[id] - solo clientes sin pedidos
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await params;
    await deleteCustomerAccount(id);

    return NextResponse.json({ success: true, message: "Cliente eliminado" });
  } catch (err) {
    if (err instanceof CustomerAdminError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "HAS_ORDERS" ? 409 : 400;
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status }
      );
    }
    console.error("Error deleting customer:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el cliente" },
      { status: 500 }
    );
  }
}
