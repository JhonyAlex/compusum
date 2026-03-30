import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomerAdminActions } from "@/components/admin/customer-admin-actions";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  ShoppingBag,
  ShoppingCart,
  Calendar,
  DollarSign,
} from "lucide-react";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ key: string }>;
}

function buildWhereClause(key: string) {
  if (key.includes("@")) {
    return { customerEmail: { equals: key, mode: "insensitive" as const } };
  }
  if (key.startsWith("+") || /^\d+$/.test(key)) {
    return { customerPhone: key };
  }
  const name = key.startsWith("nocontact-") ? key.slice("nocontact-".length) : key;
  return { customerName: name };
}

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  solicitado: { label: "Solicitado", className: "bg-yellow-100 text-yellow-700" },
  compartido: { label: "Compartido", className: "bg-blue-100 text-blue-700" },
  recibido: { label: "Recibido", className: "bg-green-100 text-green-700" },
};

const cartStatusConfig: Record<string, { label: string; className: string }> = {
  activo: { label: "Activo", className: "bg-green-100 text-green-700" },
  compartido: { label: "Compartido", className: "bg-blue-100 text-blue-700" },
  convertido: { label: "Convertido", className: "bg-purple-100 text-purple-700" },
  expirado: { label: "Expirado", className: "bg-slate-100 text-slate-600" },
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const where = buildWhereClause(key);

  const [orders, carts] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    db.cart.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (orders.length === 0 && carts.length === 0) notFound();

  // Aggregate customer info from the most recent record
  const latest = orders[0] ?? carts[0];
  const customer = {
    name: latest?.customerName ?? null,
    email: latest?.customerEmail ?? null,
    phone: latest?.customerPhone ?? null,
    company: latest?.customerCompany ?? null,
  };

  // Stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].createdAt : null;
  const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

  return (
    <div>
      <Header
        title={customer.name ?? "(Sin nombre)"}
        subtitle="Detalle del cliente"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Back button + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/clientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a clientes
            </Link>
          </Button>

          <CustomerAdminActions
            customerKey={key}
            customerName={customer.name}
            customerEmail={customer.email}
            customerPhone={customer.phone}
            customerCompany={customer.company}
          />
        </div>

        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Información del cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Nombre:</span>
                <span>{customer.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Email:</span>
                <span>{customer.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Teléfono:</span>
                <span>{customer.phone ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Empresa:</span>
                <span>{customer.company ?? "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
              <p className="text-xs text-slate-500">Pedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-slate-900">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-slate-500">Total gastado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-sm font-semibold text-slate-900">
                {firstOrderDate
                  ? firstOrderDate.toLocaleDateString("es-CO")
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">Primer pedido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-sm font-semibold text-slate-900">
                {lastOrderDate
                  ? lastOrderDate.toLocaleDateString("es-CO")
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">Último pedido</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Pedidos ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">Sin pedidos registrados.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => {
                  const status = orderStatusConfig[order.status] ?? {
                    label: order.status,
                    className: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {order.orderNumber}
                        </span>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          {order.createdAt.toLocaleDateString("es-CO")}
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatPrice(order.subtotal)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Carritos ({carts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carts.length === 0 ? (
              <p className="text-sm text-slate-500">Sin carritos registrados.</p>
            ) : (
              <div className="space-y-2">
                {carts.map((cart) => {
                  const status = cartStatusConfig[cart.status] ?? {
                    label: cart.status,
                    className: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <Link
                      key={cart.id}
                      href={`/admin/carritos/${cart.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-500">
                          {cart.uuid.slice(0, 8)}…
                        </span>
                        <Badge className={status.className}>{status.label}</Badge>
                        <span className="text-xs text-slate-500">
                          {cart.items.length} ítem{cart.items.length !== 1 && "s"}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {cart.createdAt.toLocaleDateString("es-CO")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
