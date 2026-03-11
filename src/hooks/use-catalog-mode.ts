"use client";

import { useState, useEffect } from "react";

interface CatalogModeResult {
  catalogMode: boolean;
  loading: boolean;
}

/**
 * React hook that checks whether the global store is in catalog mode.
 * Uses /api/catalog-mode for the check.
 */
export function useCatalogMode(): CatalogModeResult {
  const [catalogMode, setCatalogMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog-mode")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCatalogMode(data.data.catalogMode);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { catalogMode, loading };
}

/**
 * React hook that checks whether a specific product is in catalog mode.
 * Considers product, category, brand, and global settings.
 */
export function useProductCatalogMode(
  productCatalogMode: boolean,
  categoryCatalogMode: boolean,
  brandCatalogMode?: boolean | null
): CatalogModeResult {
  const { catalogMode: globalCatalogMode, loading } = useCatalogMode();

  const catalogMode =
    productCatalogMode ||
    categoryCatalogMode ||
    (brandCatalogMode ?? false) ||
    globalCatalogMode;

  return { catalogMode, loading };
}
