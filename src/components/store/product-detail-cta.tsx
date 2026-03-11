"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { CartProduct } from "@/stores/cart-store";

interface ProductDetailCTAProps {
  product: CartProduct;
  catalogMode?: boolean;
}

export function ProductDetailCTA({ product, catalogMode = false }: ProductDetailCTAProps) {
  const whatsappMessage = `Hola, quiero cotizar: ${product.name}${product.sku ? ` (Ref: ${product.sku})` : ""}`;
  const whatsappUrl = `https://wa.me/576063335206?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-4">
      {/* Add to Cart or Catalog Mode CTA */}
      {catalogMode ? (
        <Button
          asChild
          size="lg"
          className="w-full bg-[#0D4DAA] hover:bg-[#0a3d8a] gap-2"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" />
            Solicitar cotización
          </a>
        </Button>
      ) : (
        <AddToCartButton product={product} variant="full" />
      )}

      {/* WhatsApp & Share */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!catalogMode && (
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 gap-2 flex-1"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Cotizar por WhatsApp
            </a>
          </Button>
        )}
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
