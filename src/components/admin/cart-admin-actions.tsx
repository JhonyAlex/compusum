"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CartAdminActionsProps {
  cartId: string;
  isActive: boolean;
  status: string;
}

export function CartAdminActions({ cartId, isActive, status }: CartAdminActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/carts/${cartId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Carrito actualizado");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    handleUpdate({ status: newStatus });
  };

  const handleToggleActive = () => {
    const newActive = !active;
    setActive(newActive);
    handleUpdate({ isActive: newActive });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-600 mb-1.5 block">Estado</label>
          <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="compartido">Compartido</SelectItem>
              <SelectItem value="convertido">Convertido</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={active ? "destructive" : "default"}
          className="w-full gap-2"
          onClick={handleToggleActive}
          disabled={loading}
        >
          {active ? (
            <>
              <PowerOff className="h-4 w-4" />
              Desactivar enlace
            </>
          ) : (
            <>
              <Power className="h-4 w-4" />
              Activar enlace
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
