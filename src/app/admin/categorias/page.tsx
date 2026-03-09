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
  FolderTree,
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <Header title="Categorías" subtitle={`${categories.length} categorías en total`} />

      <div className="p-4 sm:p-6">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-slate-500">
            Arrastra para reordenar la aparición en la web
          </p>
          <Button asChild>
            <Link href="/admin/categorias/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva categoría
            </Link>
          </Button>
        </div>

        {/* Categories List */}
        <Card>
          <CardContent className="p-0">
            {categories.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab text-slate-400 hover:text-slate-600">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Icon/Image */}
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

                    {/* Info */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500"
                        asChild
                      >
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
                        disabled={category._count.products > 0}
                        title={
                          category._count.products > 0
                            ? "Mueve los productos antes de eliminar"
                            : "Eliminar categoría"
                        }
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
                  <Link href="/admin/categorias/nueva">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera categoría
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
