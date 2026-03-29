"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget view count tracker.
 * Sends a POST to increment the product view count without blocking SSR.
 */
export function ViewCountTracker({ productId }: { productId: string }) {
  useEffect(() => {
    fetch(`/api/products/${productId}/view`, { method: "POST" }).catch(() => {
      // Silent fail — view count is not critical
    });
  }, [productId]);

  return null;
}
