"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { formatPrice } from "@/lib/format";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const price = item.product.wholesalePrice || item.product.price || 0;
  const lineTotal = price * item.quantity;

  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      {/* Image */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden">
        <Image
          src={`https://picsum.photos/seed/${item.product.slug}/100/100`}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/producto/${item.product.slug}`}
          className="text-sm font-medium text-slate-900 hover:text-blue-600 line-clamp-2 transition-colors"
        >
          {item.product.name}
        </Link>
        {item.product.sku && (
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Ref: {item.product.sku}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center border border-slate-200 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-r-none"
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              aria-label={`Disminuir cantidad de ${item.product.name}`}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-xs font-medium" aria-label={`Cantidad actual: ${item.quantity}`}>{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-l-none"
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              aria-label={`Aumentar cantidad de ${item.product.name}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price & Remove */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600">
              {formatPrice(lineTotal)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-500"
              onClick={() => removeItem(item.product.id)}
              aria-label={`Eliminar ${item.product.name} del carrito`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
