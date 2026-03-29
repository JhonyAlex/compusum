"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

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

  const updateFilter = (updates: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
  };

  const hasActiveFilters =
    debouncedQuery ||
    filters.categoryId !== "all" ||
    filters.brandId !== "all" ||
    filters.featured ||
    filters.isNew ||
    filters.status !== "all";

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
                    {products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {product.images?.[0]?.imagePath ? (
                                <img
                                  src={product.images[0].imagePath}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-slate-400" />
                              )}
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
                        setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
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
                        setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
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
    </div>
  );
}
