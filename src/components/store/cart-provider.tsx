"use client";

import { usePathname } from "next/navigation";
import { CartSheet } from "@/components/store/cart-sheet";
import { useCartSync } from "@/hooks/use-cart-sync";
import { useCartRestore } from "@/hooks/use-cart-restore";

export function CartProvider() {
  const pathname = usePathname();

  // Restaurar carrito del servidor si el localStorage está vacío
  useCartRestore();
  // Auto-guardar en el servidor cuando cambian los ítems (debounced)
  useCartSync();

  // No mostrar el carrito en rutas de admin
  if (pathname.startsWith("/admin")) return null;

  return <CartSheet />;
}
