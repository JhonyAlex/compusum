import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Plus,
  Tags,
  Package,
  Edit,
  Trash2,
  ExternalLink,
  GripVertical,
} from "lucide-react";

export default async function AdminBrandsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const brands = await db.brand.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <Header title="Marcas" subtitle={`${brands.length} marcas en total`} />

      <div className="p-4 sm:p-6">
        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Button asChild>
            <Link href="/admin/marcas/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva marca
            </Link>
          </Button>
        </div>

        {/* Brands Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  {/* Logo or Initial */}
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
                    disabled={brand._count.products > 0}
                    title={
                      brand._count.products > 0
                        ? "Mueve los productos antes de eliminar"
                        : "Eliminar marca"
                    }
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
                <Link href="/admin/marcas/nueva">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera marca
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
