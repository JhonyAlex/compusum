"use client";

import { useState, useRef, useCallback } from "react";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartProduct } from "@/stores/cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: CartProduct;
  variant?: "icon" | "full";
  className?: string;
}

export function AddToCartButton({ product, variant = "icon", className }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(product.minWholesaleQty || 1);
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const handleAdd = useCallback(() => {
    addItem(product, variant === "full" ? quantity : 1);
    setOpen(true);
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1200);
    toast.success("Producto agregado al carrito", {
      description: product.variantName
        ? `${product.name} - ${product.variantName}`
        : product.name,
      action: {
        label: "Ver carrito",
        onClick: () => setOpen(true),
      },
    });
  }, [addItem, product, variant, quantity, setOpen]);

  if (variant === "icon") {
    return (
      <Button
        size="sm"
        onClick={handleAdd}
        className={`${
          added
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
        } active:scale-95 text-white gap-1.5 text-xs h-9 transition-all duration-200 ${className || ""}`}
      >
        {added ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ShoppingCart className="h-3.5 w-3.5" />
        )}
        {added ? "Agregado" : "Agregar"}
      </Button>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Cantidad:</span>
        <div className="flex items-center border border-slate-200 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label={`Disminuir cantidad de ${product.name}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium" aria-label={`Cantidad actual: ${quantity}`}>{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setQuantity(quantity + 1)}
            aria-label={`Aumentar cantidad de ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button
        onClick={handleAdd}
        className={`w-full ${
          added
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
        } active:scale-[0.98] text-white gap-2 transition-all duration-200`}
        disabled={product.stockStatus === "agotado"}
      >
        {added ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {added ? "¡Agregado al carrito!" : "Agregar al carrito"}
      </Button>
    </div>
  );
}
