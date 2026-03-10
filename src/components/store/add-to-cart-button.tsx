"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
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
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const handleAdd = () => {
    addItem(product, variant === "full" ? quantity : 1);
    toast.success("Producto agregado al carrito", {
      description: product.name,
      action: {
        label: "Ver carrito",
        onClick: () => setOpen(true),
      },
    });
  };

  if (variant === "icon") {
    return (
      <Button
        size="sm"
        onClick={handleAdd}
        className={`bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-9 ${className || ""}`}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Agregar
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
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button
        onClick={handleAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        disabled={product.stockStatus === "agotado"}
      >
        <ShoppingCart className="h-4 w-4" />
        Agregar al carrito
      </Button>
    </div>
  );
}
