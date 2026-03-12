import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ buscar?: string; page?: string }>;
}

export default async function AdminClientesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const search = params.buscar?.trim() || "";

  // Aggregate unique customers from orders grouped by email (or phone if no email)
  const allOrders = await db.order.findMany({
    where: search
      ? {
          OR: [
            { customerName: { contains: search } },
            { customerEmail: { contains: search } },
            { customerPhone: { contains: search } },
            { customerCompany: { contains: search } },
          ],
        }
      : undefined,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      customerCompany: true,
      subtotal: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by email or phone to deduplicate customers
  const customerMap = new Map<
    string,
    {
      key: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      company: string | null;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: Date;
      lastOrderNumber: string;
      lastStatus: string;
    }
  >();

  for (const order of allOrders) {
    const key =
      order.customerEmail?.toLowerCase() ||
      order.customerPhone ||
      `nocontact-${order.customerName}`;

    if (customerMap.has(key)) {
      const existing = customerMap.get(key)!;
      existing.orderCount += 1;
      existing.totalSpent += order.subtotal;
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt;
        existing.lastOrderNumber = order.orderNumber;
        existing.lastStatus = order.status;
      }
    } else {
      customerMap.set(key, {
        key,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        company: order.customerCompany,
        orderCount: 1,
        totalSpent: order.subtotal,
        lastOrderDate: order.createdAt,
        lastOrderNumber: order.orderNumber,
        lastStatus: order.status,
      });
    }
  }

  // Sort by lastOrderDate desc and paginate
  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
  );
  const total = customers.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = customers.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <Header
        title="Clientes"
        subtitle={`${total} clientes únicos`}
      />

      {/* Search */}
      <div className="px-6 py-4 border-b border-slate-200">
        <form method="get">
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              name="buscar"
              defaultValue={search}
              placeholder="Buscar por nombre, email, teléfono..."
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
              Buscar
            </Button>
            {search && (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/clientes">Limpiar</Link>
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex gap-6 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-500" />
            <strong>{total}</strong> clientes
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-green-500" />
            <strong>{allOrders.length}</strong> pedidos totales
          </span>
        </div>
      </div>

      {/* Customers List */}
      <div className="p-6">
        {paginated.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No se encontraron clientes</p>
            {search && (
              <p className="text-sm mt-1">
                Intenta con otro término de búsqueda
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((customer) => (
              <Card key={customer.key} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {customer.name ?? "(Sin nombre)"}
                        </h3>
                        {customer.company && (
                          <Badge variant="outline" className="text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {customer.company}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Último pedido:{" "}
                          {customer.lastOrderDate.toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatPrice(customer.totalSpent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {customer.orderCount}{" "}
                        {customer.orderCount === 1 ? "pedido" : "pedidos"}
                      </p>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                      >
                        <Link
                          href={`/admin/pedidos?cliente=${encodeURIComponent(
                            customer.email || customer.phone || customer.name || "cliente"
                          )}`}
                        >
                          Ver pedidos
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/admin/clientes?page=${page - 1}${
                      search ? `&buscar=${encodeURIComponent(search)}` : ""
                    }`}
                  >
                    Anterior
                  </Link>
                </Button>
              )}
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/admin/clientes?page=${page + 1}${
                      search ? `&buscar=${encodeURIComponent(search)}` : ""
                    }`}
                  >
                    Siguiente
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
