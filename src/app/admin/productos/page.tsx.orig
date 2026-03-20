import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
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
  Trash2,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

interface SearchParams {
  search?: string;
  categoria?: string;
  marca?: string;
  destacado?: string;
  nuevo?: string;
  estado?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  // Build filter conditions
  const where: any = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { sku: { contains: params.search } },
    ];
  }

  if (params.categoria && params.categoria !== "all") {
    where.categoryId = params.categoria;
  }

  if (params.marca && params.marca !== "all") {
    where.brandId = params.marca;
  }

  if (params.destacado === "true") {
    where.isFeatured = true;
  }

  if (params.nuevo === "true") {
    where.isNew = true;
  }

  if (params.estado === "activo") {
    where.isActive = true;
  } else if (params.estado === "inactivo") {
    where.isActive = false;
  }

  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const buildQueryString = (newParams: Record<string, string | undefined>) => {
    const merged = { ...params, ...newParams };
    const searchParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  return (
    <>
      <Header title="Productos" subtitle={`${products.length} productos`} />

      <div className="p-4 sm:p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o referencia..."
                  className="pl-9"
                  defaultValue={params.search}
                  name="search"
                  form="filter-form"
                />
              </div>

              {/* Category Filter */}
              <Select name="categoria" defaultValue={params.categoria || "all"}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Brand Filter */}
              <Select name="marca" defaultValue={params.marca || "all"}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select name="estado" defaultValue={params.estado || "all"}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Button asChild>
                <Link href="/admin/productos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Link>
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={params.destacado === "true" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/admin/productos${buildQueryString({ destacado: params.destacado === "true" ? undefined : "true" })}`}
                >
                  <Star className="h-3.5 w-3.5 mr-1" />
                  Destacados
                </Link>
              </Button>
              <Button
                variant={params.nuevo === "true" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/admin/productos${buildQueryString({ nuevo: params.nuevo === "true" ? undefined : "true" })}`}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Nuevos
                </Link>
              </Button>
              {(params.search ||
                params.categoria ||
                params.marca ||
                params.destacado ||
                params.nuevo ||
                params.estado) && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/productos">Limpiar filtros</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {products.length > 0 ? (
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
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {product.images[0]?.imagePath ? (
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
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No hay productos</p>
                <p className="text-sm text-slate-400 mb-4">
                  Crea tu primer producto para comenzar
                </p>
                <Button asChild>
                  <Link href="/admin/productos/nuevo">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer producto
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
