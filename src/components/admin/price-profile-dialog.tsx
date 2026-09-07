"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, Plus, Search, Trash2, X } from "lucide-react";

interface OverrideRow {
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  wholesalePrice: string;
  price: string;
}

interface PriceProfileDialogProps {
  mode: "create" | "edit";
  profileId?: string;
  triggerLabel?: string;
}

const API = "/api/admin/price-profiles";

/**
 * CRUD de perfiles de precio con overrides por producto y por variante.
 * Búsqueda de productos vía sugerencias; variantes vía detalle de producto.
 */
export function PriceProfileDialog({ mode, profileId, triggerLabel }: PriceProfileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percentAdjustment, setPercentAdjustment] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const [productOverrides, setProductOverrides] = useState<OverrideRow[]>([]);
  const [variantOverrides, setVariantOverrides] = useState<OverrideRow[]>([]);

  // Búsqueda de productos para overrides
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; sku: string | null; slug: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [variantOptions, setVariantOptions] = useState<
    Array<{ id: string; name: string; productName: string; slug: string }>
  >([]);

  const loadProfile = async () => {
    if (mode !== "edit" || !profileId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${profileId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error al cargar el perfil");
      const profile = data.data;
      setName(profile.name);
      setCode(profile.code);
      setDescription(profile.description ?? "");
      setPercentAdjustment(profile.percentAdjustment?.toString() ?? "");
      setIsActive(profile.isActive);
      setIsDefault(profile.isDefault);
      setProductOverrides(
        (profile.productOverrides ?? []).map((o: any) => ({
          productId: o.productId,
          productName: o.product?.name ?? o.productId,
          sku: o.product?.sku ?? null,
          wholesalePrice: o.wholesalePrice?.toString() ?? "",
          price: o.price?.toString() ?? "",
        }))
      );
      setVariantOverrides(
        (profile.variantOverrides ?? []).map((o: any) => ({
          variantId: o.variantId,
          productName: o.variant?.product?.name ?? o.variantId,
          variantName: o.variant?.name ?? null,
          sku: o.variant?.code ?? null,
          wholesalePrice: o.wholesalePrice?.toString() ?? "",
          price: o.price?.toString() ?? "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError(null);
      if (mode === "edit") {
        loadProfile();
      } else {
        setName("");
        setCode("");
        setDescription("");
        setPercentAdjustment("");
        setIsActive(true);
        setIsDefault(false);
        setProductOverrides([]);
        setVariantOverrides([]);
      }
    }
  }, [open, mode, profileId]);

  const runSearch = async () => {
    if (search.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      setSearchResults(data.suggestions ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadVariants = async (product: { id: string; name: string; slug: string }) => {
    try {
      const res = await fetch(`/api/products/${product.slug}`);
      const data = await res.json();
      const variants = data?.data?.variants ?? [];
      setVariantOptions(
        variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          productName: product.name,
          slug: product.slug,
        }))
      );
    } catch {
      setVariantOptions([]);
    }
  };

  const addProductOverride = (product: { id: string; name: string; sku: string | null }) => {
    if (productOverrides.some((o) => o.productId === product.id)) return;
    setProductOverrides((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, sku: product.sku, wholesalePrice: "", price: "" },
    ]);
  };

  const addVariantOverride = (variant: { id: string; name: string; productName: string }) => {
    if (variantOverrides.some((o) => o.variantId === variant.id)) return;
    setVariantOverrides((prev) => [
      ...prev,
      {
        variantId: variant.id,
        productName: variant.productName,
        variantName: variant.name,
        wholesalePrice: "",
        price: "",
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name,
        code,
        description: description || null,
        percentAdjustment: percentAdjustment === "" ? null : parseFloat(percentAdjustment),
        isActive,
        isDefault,
        productOverrides: productOverrides.map((o) => ({
          productId: o.productId,
          wholesalePrice: o.wholesalePrice === "" ? null : parseFloat(o.wholesalePrice),
          price: o.price === "" ? null : parseFloat(o.price),
        })),
        variantOverrides: variantOverrides.map((o) => ({
          variantId: o.variantId,
          wholesalePrice: o.wholesalePrice === "" ? null : parseFloat(o.wholesalePrice),
          price: o.price === "" ? null : parseFloat(o.price),
        })),
      };

      const res = await fetch(mode === "create" ? API : `${API}/${profileId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar el perfil");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={mode === "create" ? "bg-blue-600 hover:bg-blue-700" : ""} variant={mode === "create" ? "default" : "outline"}>
          {mode === "create" && <Plus className="h-4 w-4 mr-1" />}
          {triggerLabel ?? "Nuevo perfil"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo perfil de precio" : "Editar perfil de precio"}
          </DialogTitle>
          <DialogDescription>
            El precio base Siesa no se modifica: los overrides viven aparte.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && mode === "edit" ? (
          <div className="py-8 text-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando perfil...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código *</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  maxLength={60}
                  placeholder="Ej: MAYORISTA-PLUS"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ajuste % general</label>
                <Input
                  type="number"
                  step="any"
                  value={percentAdjustment}
                  onChange={(e) => setPercentAdjustment(e.target.value)}
                  placeholder="Ej: -5 (5% dcto)"
                />
              </div>
              <label className="flex items-end gap-2 text-sm text-slate-700 cursor-pointer pb-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Activo
              </label>
              <label className="flex items-end gap-2 text-sm text-slate-700 cursor-pointer pb-2">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Por defecto
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>

            {/* Overrides */}
            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Overrides de precio</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runSearch();
                      }
                    }}
                    placeholder="Buscar producto por nombre o SKU..."
                    className="pl-8"
                  />
                </div>
                <Button type="button" variant="outline" onClick={runSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="rounded-md border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div key={product.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                      <span className="truncate">
                        {product.name}
                        {product.sku ? <span className="text-slate-400 font-mono text-xs ml-2">{product.sku}</span> : null}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => addProductOverride({ id: product.id, name: product.name, sku: product.sku })}
                        >
                          Override producto
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => loadVariants(product)}
                        >
                          Ver variantes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {variantOptions.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50/50 divide-y divide-blue-100 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
                    <span>Variantes cargadas</span>
                    <button type="button" onClick={() => setVariantOptions([])}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {variantOptions.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                      <span className="truncate">
                        {variant.productName} — {variant.name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => addVariantOverride(variant)}
                      >
                        Override variante
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de overrides de producto */}
              {productOverrides.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Overrides de producto</p>
                  {productOverrides.map((o) => (
                    <div key={o.productId} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{o.productName}</span>
                      <Input
                        type="number"
                        step="any"
                        value={o.wholesalePrice}
                        onChange={(e) =>
                          setProductOverrides((prev) =>
                            prev.map((row) =>
                              row.productId === o.productId ? { ...row, wholesalePrice: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Precio COP"
                        className="w-32 h-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setProductOverrides((prev) => prev.filter((row) => row.productId !== o.productId))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de overrides de variante */}
              {variantOverrides.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Overrides de variante</p>
                  {variantOverrides.map((o) => (
                    <div key={o.variantId} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">
                        {o.productName} — {o.variantName}
                      </span>
                      <Input
                        type="number"
                        step="any"
                        value={o.wholesalePrice}
                        onChange={(e) =>
                          setVariantOverrides((prev) =>
                            prev.map((row) =>
                              row.variantId === o.variantId ? { ...row, wholesalePrice: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Precio COP"
                        className="w-32 h-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setVariantOverrides((prev) => prev.filter((row) => row.variantId !== o.variantId))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear perfil" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
