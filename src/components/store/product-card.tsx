"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles, Package } from "lucide-react";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { formatPrice } from "@/lib/format";
import type { CartProduct } from "@/stores/cart-store";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price?: number | null;
  wholesalePrice?: number | null;
  minWholesaleQty: number;
  stockStatus: string;
  isFeatured: boolean;
  isNew: boolean;
  catalogMode?: boolean;
  brand?: {
    name: string;
    slug: string;
    catalogMode?: boolean;
  } | null;
  category?: {
    name: string;
    slug: string;
    catalogMode?: boolean;
  } | null;
}

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
  globalCatalogMode?: boolean;
}

export function ProductCard({ product, variant = "default", globalCatalogMode = false }: ProductCardProps) {
  const whatsappMessage = `Hola, quiero cotizar: ${product.name}${product.sku ? ` (Ref: ${product.sku})` : ""}`;
  const whatsappUrl = `https://wa.me/576063335206?text=${encodeURIComponent(whatsappMessage)}`;

  // Resolve catalog mode: product > category > brand > global
  const isCatalogMode =
    (product.catalogMode ?? false) ||
    (product.category?.catalogMode ?? false) ||
    (product.brand?.catalogMode ?? false) ||
    globalCatalogMode;

  const stockStatusConfig = {
    disponible: { label: "Disponible", className: "bg-green-50 text-green-700 border-green-200" },
    agotado: { label: "Agotado", className: "bg-slate-50 text-slate-600 border-slate-200" },
    por_pedido: { label: "Bajo pedido", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  const config = stockStatusConfig[product.stockStatus as keyof typeof stockStatusConfig] || stockStatusConfig.disponible;

  if (variant === "compact") {
    return (
      <Card className="group overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white">
        <div className="flex gap-3 p-3">
          <div className="relative w-20 h-20 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden">
            <Image
              src={`https://picsum.photos/seed/${product.slug}/100/100`}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          </div>
          <div className="flex-1 min-w-0">
            {product.brand && (
              <p className="text-xs text-slate-400">{product.brand.name}</p>
            )}
            <Link href={`/producto/${product.slug}`}>
              <h3 className="font-medium text-slate-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
            </Link>
            {isCatalogMode ? (
              <p className="text-sm text-slate-500 mt-1 italic">
                Cotizar precio
              </p>
            ) : product.wholesalePrice ? (
              <p className="text-blue-600 font-semibold text-sm mt-1">
                {formatPrice(product.wholesalePrice)}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 bg-white">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link href={`/producto/${product.slug}`}>
          <Image
            src={`https://picsum.photos/seed/${product.slug}/400/400`}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </Link>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px] px-2 py-0.5 gap-1 font-normal">
              <Sparkles className="h-3 w-3" />
              Nuevo
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 font-normal">
              Destacado
            </Badge>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-normal ${config.className}`}>
            {config.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Brand */}
        {product.brand && (
          <Link 
            href={`/catalogo?marca=${product.brand.slug}`}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            {product.brand.name}
          </Link>
        )}

        {/* Product Name */}
        <Link href={`/producto/${product.slug}`}>
          <h3 className="font-medium text-slate-900 mt-1 line-clamp-2 hover:text-blue-600 transition-colors text-sm">
            {product.name}
          </h3>
        </Link>

        {/* SKU */}
        {product.sku && (
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Ref: {product.sku}
          </p>
        )}

        {/* Prices */}
        <div className="mt-3">
          {isCatalogMode ? (
            <p className="text-sm text-slate-500 italic">
              Consultar precio
            </p>
          ) : product.wholesalePrice ? (
            <div>
              <p className="text-lg font-semibold text-blue-600">
                {formatPrice(product.wholesalePrice)}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Package className="h-3 w-3" />
                Desde {product.minWholesaleQty} unidades
              </p>
            </div>
          ) : product.price ? (
            <p className="text-lg font-semibold text-slate-700">
              {formatPrice(product.price)}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Consultar precio
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-4">
          <AddToCartButton
            product={product as CartProduct}
            variant="icon"
            className="flex-1"
          />
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 gap-1 text-xs h-9 px-2.5"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              {isCatalogMode && <span>Cotizar</span>}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
