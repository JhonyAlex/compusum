"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Package, Edit, Trash2, ExternalLink, Loader2, Tags } from "lucide-react";
import { toast } from "sonner";

type BrandItem = {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  isActive: boolean;
  _count: { products: number };
};

type Scope = "selected" | "list" | "all";

interface Props {
  brands: BrandItem[];
}

export function AdminBrandsTable({ brands }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<Scope>("selected");

  const allSelected = brands.length > 0 && selectedIds.size === brands.length;

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/brands", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          ids: scope === "selected" ? Array.from(selectedIds) : [],
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar marcas");
      }
      return json;
    },
    onSuccess: (result) => {
      toast.success(result?.message || "Marcas eliminadas");
      setSelectedIds(new Set());
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo eliminar marcas");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar la marca");
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Marca eliminada");
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo eliminar la marca");
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
            <SelectItem value="list">Lista actual ({brands.length})</SelectItem>
            <SelectItem value="all">Todas las marcas</SelectItem>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brands.map((brand) => (
          <Card key={brand.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Checkbox
                  checked={selectedIds.has(brand.id)}
                  onCheckedChange={() => toggleRow(brand.id)}
                  aria-label={`Seleccionar ${brand.name}`}
                />
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-xl font-bold text-slate-700">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!brand.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactiva
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-slate-900">{brand.name}</h3>

              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 mb-3">
                <Package className="h-3.5 w-3.5" />
                <span>{brand._count.products} productos</span>
              </div>

              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-3"
                >
                  <ExternalLink className="h-3 w-3" />
                  {brand.website}
                </a>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/admin/marcas/${brand.id}`}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  disabled={deleteOneMutation.isPending || brand._count.products > 0}
                  title={
                    brand._count.products > 0
                      ? "Mueve los productos antes de eliminar"
                      : "Eliminar marca"
                  }
                  onClick={() => deleteOneMutation.mutate(brand.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {brands.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Tags className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No hay marcas creadas</p>
            <p className="text-sm text-slate-400 mb-4">
              Las marcas ayudan a identificar los productos
            </p>
            <Button asChild>
              <Link href="/admin/marcas/nueva">Crear primera marca</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {brands.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedIds(new Set(brands.map((brand) => brand.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <p className="text-xs text-slate-500">Seleccionar todas</p>
        </div>
      )}
    </div>
  );
}
