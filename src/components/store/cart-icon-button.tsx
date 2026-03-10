"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, getItemCount } from "@/stores/cart-store";
import { motion, AnimatePresence } from "framer-motion";

export function CartIconButton() {
  const setOpen = useCartStore((s) => s.setOpen);
  const itemCount = useCartStore(getItemCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10"
      onClick={() => setOpen(true)}
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="h-5 w-5 text-slate-700" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
