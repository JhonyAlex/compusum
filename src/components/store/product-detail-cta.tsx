"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { CartProduct } from "@/stores/cart-store";
import { formatPrice } from "@/lib/format";

interface ProductVariantOption {
  id: string;
  name: string;
  code?: string | null;
  price?: number | null;
  wholesalePrice?: number | null;
  stockStatus?: string;
}

interface ProductDetailCTAProps {
  product: CartProduct & { variants?: ProductVariantOption[] };
  catalogMode?: boolean;
}

export function ProductDetailCTA({ product, catalogMode = false }: ProductDetailCTAProps) {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const useSelectUi = variants.length > 8;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  );

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  );

  const cartProduct = useMemo<CartProduct>(() => {
    if (!selectedVariant) {
      return product;
    }

    return {
      ...product,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      variantCode: selectedVariant.code ?? null,
      price: selectedVariant.price ?? product.price,
      wholesalePrice: selectedVariant.wholesalePrice ?? product.wholesalePrice,
      stockStatus: selectedVariant.stockStatus || product.stockStatus,
    };
  }, [product, selectedVariant]);

  const variantMessage = selectedVariant
    ? ` - Variacion: ${selectedVariant.name}${selectedVariant.code ? ` (${selectedVariant.code})` : ""}`
    : "";

  const whatsappMessage = `Hola, quiero cotizar: ${product.name}${product.sku ? ` (Ref: ${product.sku})` : ""}${variantMessage}`;
  const whatsappUrl = `https://wa.me/576063335206?text=${encodeURIComponent(whatsappMessage)}`;

  const variantDisplayPrice =
    selectedVariant?.wholesalePrice ??
    selectedVariant?.price ??
    product.wholesalePrice ??
    product.price ??
    null;

  return (
    <div className="space-y-4">
      {hasVariants && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 bg-slate-50/70">
          <p className="text-sm font-semibold text-slate-800">Elegi una variacion</p>

          {useSelectUi ? (
            <div className="space-y-2">
              <label htmlFor="product-variation" className="text-xs text-slate-600">
                Variaciones disponibles
              </label>
              <select
                id="product-variation"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedVariantId ?? ""}
                onChange={(e) => setSelectedVariantId(e.target.value || null)}
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const active = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-primary/60"
                    }`}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-500">
            La variacion seleccionada se guardara en carrito, checkout y pedido.
          </p>

          {!catalogMode && selectedVariant && (
            <p className="text-xs text-primary font-medium">
              {variantDisplayPrice !== null
                ? `Precio variante: ${formatPrice(variantDisplayPrice)}`
                : "Precio variante: Consultar precio"}
            </p>
          )}
        </div>
      )}

      <AddToCartButton product={cartProduct} variant="full" />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-green-200 text-green-700 hover:bg-green-50 gap-2 flex-1"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" />
            {catalogMode ? "Solicitar cotizacion" : "Cotizar por WhatsApp"}
          </a>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          <Share2 className="h-5 w-5" />
          Compartir
        </Button>
      </div>
    </div>
  );
}