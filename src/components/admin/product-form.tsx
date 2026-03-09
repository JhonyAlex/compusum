"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  DollarSign,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/admin/image-upload";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  brandId: string | null;
  price: number | null;
  wholesalePrice: number | null;
  minWholesaleQty: number;
  stockStatus: string;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  tags: string | null;
  sortOrder: number;
  images: { id: string; imagePath: string; isPrimary: boolean }[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  brands: Brand[];
}

export function ProductForm({ product, categories, brands }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    sku: product?.sku || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    categoryId: product?.categoryId || "",
    brandId: product?.brandId || "",
    price: product?.price?.toString() || "",
    wholesalePrice: product?.wholesalePrice?.toString() || "",
    minWholesaleQty: product?.minWholesaleQty || 1,
    stockStatus: product?.stockStatus || "disponible",
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
    isActive: product?.isActive ?? true,
    tags: product?.tags || "",
    sortOrder: product?.sortOrder || 0,
    images:
      product?.images ||
      ([] as { id?: string; imagePath: string; isPrimary: boolean }[]),
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            imagePath: newImageUrl.trim(),
            isPrimary: prev.images.length === 0,
          },
        ],
      }));
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      // If we removed the primary image, make the first one primary
      if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.categoryId) {
      setError("Debes seleccionar una categoría");
      setLoading(false);
      return;
    }

    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";

      const response = await fetch(url, {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          wholesalePrice: formData.wholesalePrice
            ? parseFloat(formData.wholesalePrice)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al guardar el producto");
        return;
      }

      router.refresh();

      if (product) {
        // Return to the previous page (e.g., filtered list)
        router.back();
      } else {
        router.push("/admin/productos");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Información del producto
              </CardTitle>
              <CardDescription>Información básica del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Cuaderno Escolar 100 Hojas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">Referencia / SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="Ej: FC-CUAD-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="cuaderno-escolar-100-hojas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Descripción corta</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  placeholder="Breve descripción para listados..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción completa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descripción detallada del producto..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category and Brand */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoryId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select
                    value={formData.brandId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        brandId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin marca</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="escolar, cuaderno, back-to-school"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Precios</CardTitle>
              <CardDescription>
                Los precios son referenciales para el cliente. No hay checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio normal (COP)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="5000"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Precio mayorista (COP)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="wholesalePrice"
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wholesalePrice: e.target.value,
                        }))
                      }
                      placeholder="4000"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minWholesaleQty">
                    Unidades mínimas mayorista
                  </Label>
                  <Input
                    id="minWholesaleQty"
                    type="number"
                    value={formData.minWholesaleQty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minWholesaleQty: parseInt(e.target.value) || 1,
                      }))
                    }
                    placeholder="12"
                  />
                  <p className="text-xs text-slate-500">Ej: x12+ unidades</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado del stock</Label>
                <Select
                  value={formData.stockStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, stockStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="agotado">Agotado</SelectItem>
                    <SelectItem value="por_pedido">Por pedido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Imágenes del producto</CardTitle>
              <CardDescription>
                Agrega imágenes por URL. La primera imagen será la principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Image */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <ImageUpload
                    value={newImageUrl}
                    onChange={setNewImageUrl}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addImage}
                  variant="outline"
                  className="shrink-0 mb-0.5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {/* Image Gallery */}
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          image.isPrimary
                            ? "border-blue-500"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={image.imagePath}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3Ctext fill='%2394a3b8' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12'%3EError%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          variant={image.isPrimary ? "default" : "secondary"}
                          onClick={() => setPrimaryImage(index)}
                          className="h-7 px-2 text-xs"
                        >
                          {image.isPrimary ? "Principal" : "Hacer principal"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                          className="h-7 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {image.isPrimary && (
                        <Badge className="absolute bottom-2 left-2 text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    No hay imágenes agregadas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado y visibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Producto activo</Label>
                  <p className="text-sm text-slate-500">
                    Los productos inactivos no se muestran en la web
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFeatured">Destacado</Label>
                  <p className="text-sm text-slate-500">
                    Se mostrará en la sección de destacados
                  </p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isFeatured: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isNew">Nuevo</Label>
                  <p className="text-sm text-slate-500">
                    Se mostrará en la sección de nuevos
                  </p>
                </div>
                <Switch
                  id="isNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isNew: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden en listados</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                />
                <p className="text-xs text-slate-500">
                  Menor número = aparece primero
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 sm:flex-none"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
