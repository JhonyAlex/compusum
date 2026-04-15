"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Plus,
  Package,
  Edit,
  Eye,
  Star,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  FolderSync,
} from "lucide-react";
import { toast } from "sonner";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { normalizeProductImagePath } from "@/lib/product-fallbacks";
import { SafeProductImage } from "@/components/store/safe-product-image";

interface Filters {
  search: string;
  categoryId: string;
  brandId: string;
  featured: boolean;
  isNew: boolean;
  status: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}

type BulkScope = "selected" | "page" | "list" | "all";

async function fetchProducts(filters: Filters) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId && filters.categoryId !== "all")
    params.set("categoryId", filters.categoryId);
  if (filters.brandId && filters.brandId !== "all")
    params.set("brandId", filters.brandId);
  if (filters.featured) params.set("featured", "true");
  if (filters.isNew) params.set("new", "true");
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);

  const res = await fetch(`/api/admin/products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function AdminProductsTable() {
  const queryClient = useQueryClient();
  const { query: searchInput, setQuery: setSearchInput, debouncedQuery } = useDebouncedSearch(300);
  const [filters, setFilters] = useState<Omit<Filters, "search">>({
    categoryId: "all",
    brandId: "all",
    featured: false,
    isNew: false,
    status: "all",
    page: 1,
    limit: 25,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [rowSelectionArmed, setRowSelectionArmed] = useState(false);
  const [bulkScope, setBulkScope] = useState<BulkScope>("selected");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
  const [newCategoryName, setNewCategoryName] = useState("");

  const fullFilters: Filters = { ...filters, search: debouncedQuery };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-products", fullFilters],
    queryFn: () => fetchProducts(fullFilters),
    placeholderData: (prev) => prev,
  });

  const products = data?.data?.products ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 };
  const categories = data?.data?.categories ?? [];
  const brands = data?.data?.brands ?? [];
  const productIds = useMemo(() => products.map((product: any) => product.id), [products]);
  const selectedCount = selectedIds.size;

  const updateFilter = (updates: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  };

  const hasActiveFilters =
    debouncedQuery ||
    filters.categoryId !== "all" ||
    filters.brandId !== "all" ||
    filters.featured ||
    filters.isNew ||
    filters.status !== "all";

  const getScopeIds = (scope: BulkScope) => {
    if (scope === "selected") return Array.from(selectedIds);
    if (scope === "page") return productIds;
    return [];
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  };

  const selectFromRow = (index: number, event?: React.MouseEvent) => {
    const id = productIds[index];
    if (!id) return;

    const useShift = !!event?.shiftKey;
    const useMeta = !!event?.ctrlKey || !!event?.metaKey;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (useShift && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const rangeSelection = new Set<string>();
        for (let i = start; i <= end; i += 1) {
          const rangeId = productIds[i];
          if (rangeId) rangeSelection.add(rangeId);
        }
        return useMeta ? new Set([...next, ...rangeSelection]) : rangeSelection;
      } else if (useMeta) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        return new Set([id]);
      }

      return next;
    });

    setLastSelectedIndex(index);
  };

  const toggleFromCheckbox = (index: number, event?: React.MouseEvent) => {
    const id = productIds[index];
    if (!id) return;

    const useShift = !!event?.shiftKey;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (useShift && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i += 1) {
          const rangeId = productIds[i];
          if (rangeId) next.add(rangeId);
        }
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

    setLastSelectedIndex(index);
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest("button, a, input, textarea, select, [data-slot='checkbox']");
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (scope: BulkScope) => {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          ids: getScopeIds(scope),
          filters: {
            search: debouncedQuery,
            categoryId: filters.categoryId,
            brandId: filters.brandId,
            featured: filters.featured,
            isNew: filters.isNew,
            status: filters.status,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar productos");
      }
      return json;
    },
    onSuccess: (result) => {
      const deleted = result?.data?.deletedCount ?? 0;
      const failed = result?.data?.failedCount ?? 0;
      if (failed > 0) {
        toast.warning(`Se eliminaron ${deleted} productos y ${failed} fallaron`);
      } else {
        toast.success(`Se eliminaron ${deleted} productos`);
      }
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo eliminar productos");
    },
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        scope: bulkScope,
        ids: getScopeIds(bulkScope),
        filters: {
          search: debouncedQuery,
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          featured: filters.featured,
          isNew: filters.isNew,
          status: filters.status,
        },
        categoryId: selectedCategoryId !== "none" ? selectedCategoryId : undefined,
        createCategoryName: newCategoryName.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo cambiar categoría");
      }
      return json;
    },
    onSuccess: (result) => {
      toast.success(`Se actualizaron ${result?.data?.updatedCount ?? 0} productos`);
      setIsCategoryModalOpen(false);
      setSelectedCategoryId("none");
      setNewCategoryName("");
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo cambiar la categoría");
    },
  });

  const togglePageSelection = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        productIds.forEach((id) => next.add(id));
      } else {
        productIds.forEach((id) => next.delete(id));
      }
      return next;
    });
    setRowSelectionArmed(true);
  };

  const selectedOnPage = productIds.filter((id) => selectedIds.has(id)).length;
  const allOnPageSelected = productIds.length > 0 && selectedOnPage === productIds.length;

  return (
    <div className="p-4 sm:p-6">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o referencia..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <Select
              value={filters.categoryId}
              onValueChange={(v) => updateFilter({ categoryId: v })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.brandId}
              onValueChange={(v) => updateFilter({ brandId: v })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {brands.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(v) => updateFilter({ status: v })}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Button asChild>
              <Link href="/admin/productos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Link>
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant={filters.featured ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter({ featured: !filters.featured })}
            >
              <Star className="h-3.5 w-3.5 mr-1" />
              Destacados
            </Button>
            <Button
              variant={filters.isNew ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter({ isNew: !filters.isNew })}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Nuevos
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  clearSelection();
                  setFilters({
                    categoryId: "all",
                    brandId: "all",
                    featured: false,
                    isNew: false,
                    status: "all",
                    page: 1,
                    limit: 25,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  });
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
            <Select
              value={bulkScope}
              onValueChange={(value) => setBulkScope(value as BulkScope)}
            >
              <SelectTrigger className="w-[220px] bg-white">
                <SelectValue placeholder="Alcance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Seleccionados ({selectedCount})</SelectItem>
                <SelectItem value="page">Página actual ({productIds.length})</SelectItem>
                <SelectItem value="list">Lista actual (filtros)</SelectItem>
                <SelectItem value="all">Todos los productos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(true)}
              disabled={
                bulkCategoryMutation.isPending ||
                (bulkScope === "selected" && selectedCount === 0) ||
                (bulkScope === "page" && productIds.length === 0)
              }
            >
              <FolderSync className="h-4 w-4 mr-2" />
              Cambiar categoría
            </Button>

            <Button
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(bulkScope)}
              disabled={
                bulkDeleteMutation.isPending ||
                (bulkScope === "selected" && selectedCount === 0) ||
                (bulkScope === "page" && productIds.length === 0)
              }
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar masivo
            </Button>

            <p className="text-xs text-slate-500 ml-auto">
              Tip: marca un checkbox y luego usa clic en fila. Shift = rango, Ctrl/Cmd = alternar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="w-10 py-3 px-3">
                        <Checkbox
                          checked={allOnPageSelected}
                          onCheckedChange={(checked) => togglePageSelection(!!checked)}
                          aria-label="Seleccionar página"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                        Producto
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                        Categoría
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                        Precio
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                        Badges
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                        Estado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product: any, index: number) => (
                      <tr
                        key={product.id}
                        className={
                          selectedIds.has(product.id)
                            ? "bg-blue-50/60 hover:bg-blue-50"
                            : "hover:bg-slate-50"
                        }
                        onClick={(event) => {
                          if (!rowSelectionArmed || isInteractiveTarget(event.target)) return;
                          selectFromRow(index, event);
                        }}
                      >
                        <td className="py-3 px-3" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(product.id)}
                            onClick={(event) => {
                              event.preventDefault();
                              setRowSelectionArmed(true);
                              toggleFromCheckbox(index, event);
                            }}
                            aria-label={`Seleccionar ${product.name}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <SafeProductImage
                                src={normalizeProductImagePath(product.images?.[0]?.imagePath)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                fallbackText="próximamente"
                                preventNotFoundLog
                              />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {product.name}
                              </p>
                              {product.sku && (
                                <p className="text-xs text-slate-500">
                                  {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600">
                            {product.category?.name || "-"}
                          </span>
                          {product.brand && (
                            <span className="text-xs text-slate-400 block">
                              {product.brand.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {product.price && (
                              <p className="text-slate-900">
                                ${product.price.toLocaleString("es-CO")}
                              </p>
                            )}
                            {product.wholesalePrice && (
                              <p className="text-xs text-green-600">
                                May: $
                                {product.wholesalePrice.toLocaleString("es-CO")}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {product.isFeatured && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-amber-100 text-amber-700"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Destacado
                              </Badge>
                            )}
                            {product.isNew && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Nuevo
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {product.isActive ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200"
                            >
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">
                              Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/producto/${product.slug}`}
                                target="_blank"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/productos/${product.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} productos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || isFetching}
                      onClick={() =>
                        setFilters((prev) => {
                          clearSelection();
                          return { ...prev, page: prev.page - 1 };
                        })
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isFetching}
                      onClick={() =>
                        setFilters((prev) => {
                          clearSelection();
                          return { ...prev, page: prev.page + 1 };
                        })
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No hay productos</p>
              <p className="text-sm text-slate-400 mb-4">
                {hasActiveFilters
                  ? "No se encontraron productos con los filtros seleccionados"
                  : "Crea tu primer producto para comenzar"}
              </p>
              <Button asChild>
                <Link href="/admin/productos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  {hasActiveFilters ? "Crear producto" : "Crear primer producto"}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar categoría de productos</DialogTitle>
            <DialogDescription>
              Puedes elegir una categoría existente o crear una nueva en este mismo modal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Categoría existente</p>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin selección</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">O crear nueva categoría</p>
              <Input
                placeholder="Nombre de nueva categoría"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={bulkCategoryMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => bulkCategoryMutation.mutate()}
              disabled={
                bulkCategoryMutation.isPending ||
                (!newCategoryName.trim() && selectedCategoryId === "none")
              }
            >
              {bulkCategoryMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Aplicar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
