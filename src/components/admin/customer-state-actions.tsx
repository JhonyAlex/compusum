"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Trash2, Power } from "lucide-react";

/**
 * Acciones de estado del cliente en el maestro: activar/desactivar y eliminar
 * (solo sin pedidos). La eliminación nunca rompe pedidos históricos.
 */
export function CustomerStateActions({
  customerId,
  isActive,
  hasOrders,
}: {
  customerId: string;
  isActive: boolean;
  hasOrders: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = async () => {
    setError(null);
    setLoading("toggle");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al cambiar el estado");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(null);
    }
  };

  const deleteCustomer = async () => {
    setError(null);
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al eliminar");
      }
      router.push("/admin/clientes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setConfirmOpen(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleActive}
          disabled={loading !== null}
          className={isActive ? "text-amber-700 border-amber-300 hover:bg-amber-50" : "text-green-700 border-green-300 hover:bg-green-50"}
        >
          {loading === "toggle" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Power className="h-4 w-4 mr-1" />
          )}
          {isActive ? "Desactivar" : "Activar"}
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={hasOrders || loading !== null}
              title={hasOrders ? "No se puede eliminar un cliente con pedidos" : undefined}
              className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Eliminar cliente</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Solo disponible para clientes sin pedidos.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              ¿Seguro que deseas eliminar esta cuenta del maestro de clientes?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading !== null}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={deleteCustomer} disabled={loading !== null}>
                {loading === "delete" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
