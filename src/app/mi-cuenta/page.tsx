"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/store/login-modal";
import { LogOut, LogIn, Package, User } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number | null;
  sentVia: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number | null;
  }>;
}

const STATUS_STYLES: Record<string, string> = {
  solicitado: "bg-yellow-100 text-yellow-800",
  compartido: "bg-blue-100 text-blue-800",
  recibido: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  solicitado: "En proceso",
  compartido: "Enviado",
  recibido: "Confirmado",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { customer, loading, logout } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // Cargar pedidos si el usuario está logueado
  useEffect(() => {
    if (!loading && customer) {
      loadOrders();
    } else if (!loading && !customer) {
      setOrdersLoading(false);
    }
  }, [loading, customer]);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders/mine");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
        }
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-slate-500">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mi Cuenta</h1>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Volver al inicio
          </Link>
        </div>

        {/* Not logged in state */}
        {!customer ? (
          <Card className="bg-white border-slate-200">
            <CardHeader className="text-center py-12">
              <LogIn className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <CardTitle className="text-2xl mb-2">No estás logueado</CardTitle>
              <p className="text-slate-600 mb-6">
                Inicia sesión con tu teléfono para ver todos tus pedidos en cualquier dispositivo
              </p>
              <Button
                onClick={() => setLoginOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white mx-auto"
              >
                Iniciar sesión
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* User Info Card */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{customer.name}</h2>
                      <p className="text-sm text-slate-600">{customer.phone && `+57 ${customer.phone}`}</p>
                      {customer.email && (
                        <p className="text-sm text-slate-600">{customer.email}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Orders Section */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Mis Pedidos</h2>

              {ordersLoading ? (
                <div className="text-center text-slate-500 py-8">Cargando pedidos...</div>
              ) : orders.length === 0 ? (
                <Card className="bg-white border-slate-200">
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 mb-4">No tenés pedidos registrados aún.</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/catalogo">Empezar a comprar</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{order.orderNumber}</h3>
                            <p className="text-sm text-slate-600">
                              {new Date(order.createdAt).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-slate-600">
                              <span>
                                {item.productName}
                                {item.productSku && (
                                  <span className="text-xs text-slate-500 ml-2">({item.productSku})</span>
                                )}
                              </span>
                              <span className="font-medium">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        {order.subtotal != null && (
                          <div className="flex justify-end">
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-1">Total</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {order.subtotal.toLocaleString("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  minimumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {order.sentVia && (
                          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                            Enviado por: <span className="font-medium capitalize">{order.sentVia}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
