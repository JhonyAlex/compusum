import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { isGlobalCatalogModeEnabled } from "@/lib/catalog-mode";
import { 
  SlidersHorizontal, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Package
} from "lucide-react";

export const revalidate = 3600; // ⚡ Bolt: Cache product catalog base data for 1 hour to prevent heavy category/brand aggregations

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  categoria?: string;
  marca?: string;
  buscar?: string;
  destacados?: string;
  nuevo?: string;
  ordenar?: string;
  pagina?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.pagina || "1");
  let categories: Awaited<ReturnType<typeof db.category.findMany>> = [];
  let brands: Awaited<ReturnType<typeof db.brand.findMany>> = [];
  let products: Awaited<ReturnType<typeof db.product.findMany>> = [];
  let totalProducts = 0;
  let globalCatalogMode = false;

  try {
    globalCatalogMode = await isGlobalCatalogModeEnabled();
  } catch (error) {
    console.error("Catalog mode check failed:", error instanceof Error ? error.message : error);
  }

  try {
    [categories, brands] = await Promise.all([
      db.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          children: { where: { isActive: true } },
          _count: { select: { products: { where: { isActive: true } } } }
        },
        orderBy: { name: "asc" }
      }),
      db.brand.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { products: { where: { isActive: true } } } }
        },
        orderBy: { name: "asc" }
      }),
    ]);

    const where: Record<string, unknown> = { isActive: true };

    if (params.categoria) {
      const category = await db.category.findFirst({
        where: { slug: params.categoria }
      });
      if (category) {
        const childCategories = await db.category.findMany({
          where: { parentId: category.id },
          select: { id: true }
        });
        const categoryIds = [category.id, ...childCategories.map(c => c.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    if (params.marca) {
      const brand = await db.brand.findFirst({
        where: { slug: params.marca }
      });
      if (brand) {
        where.brandId = brand.id;
      }
    }

    if (params.buscar) {
      where.OR = [
        { name: { contains: params.buscar } },
        { sku: { contains: params.buscar } },
        { description: { contains: params.buscar } }
      ];
    }

    if (params.destacados === "true") {
      where.isFeatured = true;
    }

    if (params.nuevo === "true") {
      where.isNew = true;
    }

    let orderBy: Record<string, unknown>[] = [{ createdAt: "desc" }];
    switch (params.ordenar) {
      case "nombre-asc":
        orderBy = [{ name: "asc" }];
        break;
      case "nombre-desc":
        orderBy = [{ name: "desc" }];
        break;
      case "precio-asc":
        orderBy = [{ wholesalePrice: "asc" }];
        break;
      case "precio-desc":
        orderBy = [{ wholesalePrice: "desc" }];
        break;
    }

    [products, totalProducts] = await Promise.all([
      db.product.findMany({
        where,
        include: { brand: true, category: true },
        orderBy,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      db.product.count({ where }),
    ]);
  } catch (error) {
    console.error("CatalogoPage query failed", error);
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Get current filters for display
  const currentCategory = categories.find(c => c.slug === params.categoria);
  const currentBrand = brands.find(b => b.slug === params.marca);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7EFEF]">
      <Header />
      
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-[#0D4DAA] text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              Catálogo de Productos
            </h1>
            <p className="text-white/80 mt-2">
              Explora nuestro catálogo completo de productos escolares y de oficina
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-fredoka)" }}>
                    Filtros
                  </h2>
                  <SlidersHorizontal className="h-5 w-5 text-gray-400" />
                </div>

                {/* Active Filters */}
                {(currentCategory || currentBrand || params.buscar || params.destacados || params.nuevo) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Filtros activos:</span>
                      <Link href="/catalogo" className="text-sm text-[#0D4DAA] hover:underline">
                        Limpiar
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentCategory && (
                        <Badge variant="secondary" className="gap-1">
                          {currentCategory.name}
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, categoria: '' }).toString()}`}>
                            <X className="h-3 w-3" />
                          </Link>
                        </Badge>
                      )}
                      {currentBrand && (
                        <Badge variant="secondary" className="gap-1">
                          {currentBrand.name}
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, marca: '' }).toString()}`}>
                            <X className="h-3 w-3" />
                          </Link>
                        </Badge>
                      )}
                      {params.destacados === "true" && (
                        <Badge variant="secondary" className="gap-1">
                          Destacados
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, destacados: '' }).toString()}`}>
                            <X className="h-3 w-3" />
                          </Link>
                        </Badge>
                      )}
                      {params.nuevo === "true" && (
                        <Badge variant="secondary" className="gap-1">
                          Nuevos
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, nuevo: '' }).toString()}`}>
                            <X className="h-3 w-3" />
                          </Link>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <form>
                      <Input
                        type="search"
                        name="buscar"
                        placeholder="Nombre, SKU..."
                        defaultValue={params.buscar}
                        className="pl-10"
                      />
                    </form>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-2 block">Categorías</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/catalogo?categoria=${category.slug}`}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-colors ${
                          params.categoria === category.slug
                            ? "bg-[#0D4DAA] text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </span>
                        <span className="text-xs opacity-60">({category._count.products})</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-2 block">Marcas</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.filter(b => b._count.products > 0).map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/catalogo?marca=${brand.slug}`}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-colors ${
                          params.marca === brand.slug
                            ? "bg-[#0D4DAA] text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span>{brand.name}</span>
                        <span className="text-xs opacity-60">({brand._count.products})</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Filtros rápidos</Label>
                  <Link
                    href="/catalogo?destacados=true"
                    className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                      params.destacados === "true"
                        ? "bg-[#E89A00] text-white"
                        : "bg-[#E89A00]/10 text-[#E89A00] hover:bg-[#E89A00]/20"
                    }`}
                  >
                    ⭐ Productos destacados
                  </Link>
                  <Link
                    href="/catalogo?nuevo=true"
                    className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                      params.nuevo === "true"
                        ? "bg-green-500 text-white"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    🆕 Nuevos productos
                  </Link>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Sort & Results Count */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white rounded-xl shadow-sm p-4">
                <p className="text-gray-500">
                  <span className="font-semibold text-[#1a1a2e]">{totalProducts}</span> productos encontrados
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ordenar por:</span>
                  <Select defaultValue={params.ordenar || "recientes"}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recientes">Más recientes</SelectItem>
                      <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
                      <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
                      <SelectItem value="precio-asc">Precio (menor)</SelectItem>
                      <SelectItem value="precio-desc">Precio (mayor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products */}
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} globalCatalogMode={globalCatalogMode} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        asChild={currentPage > 1}
                      >
                        {currentPage > 1 ? (
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, pagina: String(currentPage - 1) }).toString()}`}>
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Link>
                        ) : (
                          <span>
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </span>
                        )}
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          
                          return (
                            <Link
                              key={page}
                              href={`/catalogo?${new URLSearchParams({ ...params, pagina: String(page) }).toString()}`}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                currentPage === page
                                  ? "bg-[#0D4DAA] text-white"
                                  : "bg-white hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </Link>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        asChild={currentPage < totalPages}
                      >
                        {currentPage < totalPages ? (
                          <Link href={`/catalogo?${new URLSearchParams({ ...params, pagina: String(currentPage + 1) }).toString()}`}>
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span>
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1a1a2e] mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Intenta ajustar los filtros o realizar una nueva búsqueda
                  </p>
                  <Button asChild>
                    <Link href="/catalogo">Ver todo el catálogo</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
