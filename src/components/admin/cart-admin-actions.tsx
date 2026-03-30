"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CartAdminActionsProps {
  cartId: string;
  isActive: boolean;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCompany?: string | null;
  notes?: string | null;
  hasOrders?: boolean;
}

export function CartAdminActions({
  cartId,
  isActive,
  status,
  customerName,
  customerEmail,
  customerPhone,
  customerCompany,
  notes,
  hasOrders,
}: CartAdminActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: customerName || "",
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || "",
    customerCompany: customerCompany || "",
    notes: notes || "",
  });
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

  const handleEditSubmit = async () => {
    await handleUpdate(editForm);
    setEditOpen(false);
  };

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/carts/${cartId}/duplicate`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Carrito duplicado");
        router.push(`/admin/carritos/${result.data.id}`);
      } else {
        toast.error(result.error || "Error al duplicar");
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
      const res = await fetch(`/api/admin/carts/${cartId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Carrito eliminado");
        router.push("/admin/carritos");
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
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

        {/* Edit customer info */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Pencil className="h-4 w-4" />
              Editar datos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar datos del cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre</Label>
                <Input
                  id="customerName"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Teléfono</Label>
                <Input
                  id="customerPhone"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCompany">Empresa</Label>
                <Input
                  id="customerCompany"
                  value={editForm.customerCompany}
                  onChange={(e) => setEditForm({ ...editForm, customerCompany: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleEditSubmit} disabled={loading}>
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleDuplicate}
          disabled={loading}
        >
          <Copy className="h-4 w-4" />
          Duplicar carrito
        </Button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={loading || hasOrders}
              title={hasOrders ? "No se puede eliminar un carrito con pedidos asociados" : undefined}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar carrito
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este carrito?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el carrito y todos sus productos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {hasOrders && (
          <p className="text-xs text-slate-500 text-center">
            No se puede eliminar porque tiene pedidos asociados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
