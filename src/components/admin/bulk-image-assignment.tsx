"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Search, Link2 } from "lucide-react";

type UploadedFile = {
  name?: string;
  url: string;
  modifiedAt?: string;
  size?: number;
};

type UploadResultItem = {
  originalName: string;
  fileName: string;
  url: string;
  autoAssigned: boolean;
  matchedSku: string | null;
  productId: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
};

async function fetchUploadedFiles(): Promise<UploadedFile[]> {
  const res = await fetch("/api/admin/upload", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "No se pudo listar archivos subidos");
  }
  return json.data.files || [];
}

async function fetchProducts(search: string): Promise<ProductOption[]> {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "25");
  if (search.trim()) params.set("search", search.trim());

  const res = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "No se pudieron listar productos");
  }

  return (json.data.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
  }));
}

export function BulkImageAssignment() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [autoAssignBySku, setAutoAssignBySku] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const [uploadItems, setUploadItems] = useState<UploadResultItem[]>([]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [selectedImage, setSelectedImage] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignOk, setAssignOk] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const refreshUploadedFiles = async () => {
    setLoadingFiles(true);
    try {
      const list = await fetchUploadedFiles();
      setUploadedFiles(list);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo cargar el listado de imágenes");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    refreshUploadedFiles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const result = await fetchProducts(productQuery);
        setProducts(result);
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : "Error al buscar productos");
      } finally {
        setLoadingProducts(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [productQuery]);

  const onSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files ? Array.from(event.target.files) : [];
    setFiles(list);
    setUploadError("");
    setUploadInfo("");
  };

  const onUpload = async () => {
    if (files.length === 0) {
      setUploadError("Selecciona al menos una imagen.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadInfo("");

    try {
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
      }
      form.append("autoAssignBySku", autoAssignBySku ? "true" : "false");

      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudieron subir las imágenes");
      }

      const data = json.data;
      setUploadItems(data.uploaded || []);
      setUploadInfo(
        `Subidas ${data.uploadedCount}/${data.total}. Autoasignadas por SKU: ${data.autoAssignedCount}.`
      );

      if ((data.errors || []).length > 0) {
        setUploadError((data.errors as string[]).join(" | "));
      }

      await refreshUploadedFiles();
      setFiles([]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  };

  const onAssignImage = async () => {
    if (!selectedImage) {
      setAssignError("Selecciona una imagen.");
      return;
    }
    if (!selectedProductId) {
      setAssignError("Selecciona un producto.");
      return;
    }

    setAssigning(true);
    setAssignError("");
    setAssignOk("");

    try {
      const res = await fetch("/api/admin/products/assign-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, imagePath: selectedImage }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo asignar la imagen");
      }

      setAssignOk("Imagen asignada correctamente al producto.");
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Error al asignar imagen");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pt-0 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imágenes masivas y asignación por SKU</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-images">Subir múltiples imágenes</Label>
            <Input id="bulk-images" type="file" multiple accept="image/*" onChange={onSelectFiles} />
            <p className="text-xs text-slate-500">
              Si activas la opción, cada imagen intentará asignarse automáticamente por nombre de archivo contra SKU.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={autoAssignBySku} onCheckedChange={setAutoAssignBySku} />
            <Label>Autoasignar por SKU (nombre de archivo con o sin extensión)</Label>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={onUpload} disabled={uploading || files.length === 0}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir imágenes
            </Button>
            <Badge variant="secondary">Seleccionadas: {files.length}</Badge>
          </div>

          {uploadInfo && (
            <Alert>
              <AlertDescription>{uploadInfo}</AlertDescription>
            </Alert>
          )}
          {uploadError && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {uploadItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Última subida</p>
              <div className="max-h-64 overflow-auto rounded border border-slate-200">
                {uploadItems.map((item) => (
                  <div key={item.fileName} className="px-3 py-2 text-sm border-b border-slate-100 last:border-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.originalName}</p>
                      <p className="text-xs text-slate-500 truncate">{item.url}</p>
                    </div>
                    <div>
                      {item.autoAssigned ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          SKU: {item.matchedSku || "coincidencia"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin autoasignar</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignación manual (select con buscador)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Imagen subida</Label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedImage}
              onChange={(e) => setSelectedImage(e.target.value)}
              disabled={loadingFiles}
            >
              <option value="">Selecciona una imagen</option>
              {uploadedFiles.map((file) => (
                <option key={file.url} value={file.url}>
                  {file.name || file.url}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={refreshUploadedFiles} disabled={loadingFiles}>
              {loadingFiles ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              Recargar listado
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Buscar producto por nombre o SKU</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Escribe para buscar producto..."
                className="pl-9"
              />
            </div>
            <div className="max-h-56 overflow-auto rounded border border-slate-200">
              {loadingProducts ? (
                <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                </div>
              ) : products.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">No hay resultados.</div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 ${selectedProductId === product.id ? "bg-slate-100" : ""}`}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">SKU: {product.sku || "sin SKU"}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3 text-sm">
            <p><span className="font-medium">Imagen:</span> {selectedImage || "No seleccionada"}</p>
            <p>
              <span className="font-medium">Producto:</span>{" "}
              {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku || "sin SKU"})` : "No seleccionado"}
            </p>
          </div>

          <Button onClick={onAssignImage} disabled={assigning}>
            {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            Asignar imagen al producto
          </Button>

          {assignOk && (
            <Alert>
              <AlertDescription>{assignOk}</AlertDescription>
            </Alert>
          )}
          {assignError && (
            <Alert variant="destructive">
              <AlertDescription>{assignError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
