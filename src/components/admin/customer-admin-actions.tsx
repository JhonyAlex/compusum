"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CustomerAdminActionsProps {
  customerKey: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCompany: string | null;
}

export function CustomerAdminActions({
  customerKey,
  customerName,
  customerEmail,
  customerPhone,
  customerCompany,
}: CustomerAdminActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: customerName || "",
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || "",
    customerCompany: customerCompany || "",
  });
  const router = useRouter();

  const handleEdit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${encodeURIComponent(customerKey)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      const result = await res.json();
      if (result.success) {
        toast.success("Datos del cliente actualizados");
        setEditOpen(false);
        const newKey = result.data?.newKey;
        if (newKey && newKey !== customerKey) {
          router.push(`/admin/clientes/${encodeURIComponent(newKey)}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${encodeURIComponent(customerKey)}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (result.success) {
        toast.success("Datos del cliente anonimizados");
        router.push("/admin/clientes");
      } else {
        toast.error(result.error || "Error al eliminar datos");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Editar datos
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar datos del cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="customerName">Nombre</Label>
              <Input
                id="customerName"
                value={editForm.customerName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={editForm.customerEmail}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, customerEmail: e.target.value }))
                }
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Teléfono</Label>
              <Input
                id="customerPhone"
                value={editForm.customerPhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, customerPhone: e.target.value }))
                }
                placeholder="+57..."
              />
            </div>
            <div>
              <Label htmlFor="customerCompany">Empresa</Label>
              <Input
                id="customerCompany"
                value={editForm.customerCompany}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    customerCompany: e.target.value,
                  }))
                }
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar datos del cliente
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar datos del cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción anonimizará los datos del cliente (nombre, email,
              teléfono, empresa) en todos sus pedidos y carritos. Los pedidos y
              carritos NO se eliminarán. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Sí, eliminar datos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
