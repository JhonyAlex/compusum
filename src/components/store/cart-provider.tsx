"use client";

import { usePathname } from "next/navigation";
import { CartSheet } from "@/components/store/cart-sheet";

export function CartProvider() {
  const pathname = usePathname();

  // No mostrar el carrito en rutas de admin
  if (pathname.startsWith("/admin")) return null;

  return <CartSheet />;
}
