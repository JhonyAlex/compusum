"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number | null;
  sentVia: string | null;
  createdAt: string;
  items: OrderItem[];
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

export default function MisPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/mine")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis Pedidos</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Seguir comprando
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Cargando pedidos…</div>
      ) : orders.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p className="mb-2 font-medium">No tenés pedidos registrados aún.</p>
          <p className="text-sm">
            Los pedidos aparecen aquí después de confirmar en el checkout.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-semibold text-sm">{order.orderNumber}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Productos */}
              <ul className="text-sm space-y-0.5 mb-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-muted-foreground">
                    <span>
                      {item.productName}
                      {item.productSku ? (
                        <span className="text-xs ml-1">({item.productSku})</span>
                      ) : null}
                    </span>
                    <span>×{item.quantity}</span>
                  </li>
                ))}
              </ul>

              {order.subtotal != null && (
                <p className="text-sm font-medium text-right">
                  Total:{" "}
                  {order.subtotal.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
