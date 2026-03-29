"use client";

import { useEffect, useRef } from "react";
import { useCartStore, CartItem } from "@/stores/cart-store";

/**
 * Al montar el provider, si el carrito local (localStorage) está vacío,
 * intenta recuperar el carrito activo del servidor para este sessionId/usuario.
 * El middleware ya inyecta x-session-id en los headers del request, así que
 * la API devuelve el carrito correcto automáticamente.
 */
export function useCartRestore() {
  const items = useCartStore((s) => s.items);
  const loadItems = useCartStore((s) => s.loadItems);
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Si ya hay ítems en localStorage o ya intentamos restaurar, no hacer nada
    if (hasAttempted.current || items.length > 0) return;
    hasAttempted.current = true;

    fetch("/api/carts")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data?.success || !data.data?.items?.length) return;

        const serverItems: CartItem[] = data.data.items.map(
          (ci: {
            quantity: number;
            product: {
              id: string;
              name: string;
              slug: string;
              sku: string | null;
              price: number | null;
              wholesalePrice: number | null;
              minWholesaleQty?: number;
              stockStatus?: string;
              brand?: { name: string; slug: string } | null;
              category?: { name: string; slug: string } | null;
            };
          }) => ({
            product: {
              id: ci.product.id,
              name: ci.product.name,
              slug: ci.product.slug,
              sku: ci.product.sku,
              price: ci.product.price,
              wholesalePrice: ci.product.wholesalePrice,
              minWholesaleQty: ci.product.minWholesaleQty ?? 1,
              stockStatus: ci.product.stockStatus ?? "available",
              brand: ci.product.brand ?? null,
              category: ci.product.category ?? null,
            },
            quantity: ci.quantity,
          })
        );

        loadItems(serverItems);
      })
      .catch(() => {
        // Silencioso: si falla la red, localStorage ya tiene los datos
      });
    // Intencionalmente sin deps: solo corre en mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
