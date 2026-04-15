"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { FolderTree, Package, Edit, Trash2, Eye, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  isActive: boolean;
  _count: { products: number };
};

type Scope = "selected" | "list" | "all";

interface Props {
  categories: CategoryItem[];
}

export function AdminCategoriesTable({ categories }: Props) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<Scope>("selected");

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = categories.length > 0 && selectedIds.size === categories.length;

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          ids: scope === "selected" ? Array.from(selectedIds) : [],
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar categorías");
      }
      return json;
    },
    onSuccess: (result) => {
      toast.success(result?.message || "Categorías eliminadas");
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo eliminar categorías");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar la categoría");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Categoría eliminada");
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo eliminar la categoría");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <Select value={scope} onValueChange={(value) => setScope(value as Scope)}>
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Alcance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selected">Seleccionadas ({selectedIds.size})</SelectItem>
            <SelectItem value="list">Lista actual ({categories.length})</SelectItem>
            <SelectItem value="all">Todas las categorías</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="destructive"
          disabled={bulkDeleteMutation.isPending || (scope === "selected" && selectedIds.size === 0)}
          onClick={() => bulkDeleteMutation.mutate()}
        >
          {bulkDeleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Eliminar masivo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {categories.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <div className="flex items-center gap-4 p-3 border-b bg-slate-50">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(new Set(categories.map((c) => c.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
                <p className="text-xs text-slate-500">Seleccionar todo</p>
              </div>

              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(category.id)}
                    onCheckedChange={() => toggleRow(category.id)}
                    aria-label={`Seleccionar ${category.name}`}
                  />

                  <div className="cursor-grab text-slate-400 hover:text-slate-600">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : category.icon ? (
                      <span className="text-2xl">{category.icon}</span>
                    ) : (
                      <FolderTree className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{category.name}</p>
                      {!category.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactiva
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {category._count.products} productos
                      </span>
                      <span>/{category.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500" asChild>
                      <Link href={`/catalogo?categoria=${category.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/categorias/${category.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={deleteOneMutation.isPending || category._count.products > 0}
                      title={
                        category._count.products > 0
                          ? "Mueve los productos antes de eliminar"
                          : "Eliminar categoría"
                      }
                      onClick={() => deleteOneMutation.mutate(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderTree className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No hay categorías creadas</p>
              <p className="text-sm text-slate-400 mb-4">
                Las categorías ayudan a organizar tus productos
              </p>
              <Button asChild>
                <Link href="/admin/categorias/nueva">Crear primera categoría</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
