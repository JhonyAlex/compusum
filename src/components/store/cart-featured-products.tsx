"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalogMode } from "@/hooks/use-catalog-mode";
import { useCartStore, type CartProduct } from "@/stores/cart-store";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  wholesalePrice: number | null;
  minWholesaleQty: number;
  stockStatus: string;
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
}

export function CartFeaturedProducts() {
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);
  const { catalogMode } = useCatalogMode();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const fetchFeaturedProducts = () => {
    setLoading(true);
    fetch("/api/products?featured=true&limit=6")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const crossSellEnabled = data?.data?.catalog?.cross_sell_enabled?.value;
        if (crossSellEnabled === false) {
          setEnabled(false);
          return;
        }
        fetchFeaturedProducts();
      })
      .catch(() => {
        // Fallback: load featured products when settings fetch fails
        fetchFeaturedProducts();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled || loading || products.length === 0) return null;

  const handleAdd = (product: FeaturedProduct) => {
    addItem(product as CartProduct, 1);
    toast.success("Producto agregado", { description: product.name });
  };

  return (
    <div className="mt-6 w-full px-2">
      <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider text-center">
        Productos destacados
      </p>
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-slate-50 transition-colors"
          >
            <div className="relative w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden">
              <Image
                src={`https://picsum.photos/seed/${product.slug}/60/60`}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/producto/${product.slug}`}
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-slate-800 hover:text-blue-600 line-clamp-2 leading-snug transition-colors"
              >
                {product.name}
              </Link>
              {catalogMode ? (
                <p className="text-xs text-slate-400 italic mt-0.5">Consultar precio</p>
              ) : (
                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                  {formatPrice(product.wholesalePrice || product.price)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:border-blue-300 flex-shrink-0"
              onClick={() => handleAdd(product)}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="w-full mt-3 text-blue-600 hover:text-blue-700 text-xs"
        onClick={() => setOpen(false)}
      >
        <Link href="/catalogo?destacados=true">Ver todos los destacados</Link>
      </Button>
    </div>
  );
}
