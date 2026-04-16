"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: CategoryNode[];
}

interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface CartEmptyTopCategoriesProps {
  onNavigate?: () => void;
}

function flattenCategories(nodes: CategoryNode[]): FlatCategory[] {
  return nodes.flatMap((node) => {
    const current: FlatCategory = {
      id: node.id,
      name: node.name,
      slug: node.slug,
      productCount: typeof node.productCount === "number" ? node.productCount : 0,
    };

    const children = Array.isArray(node.children)
      ? flattenCategories(node.children)
      : [];

    return [current, ...children];
  });
}

export function CartEmptyTopCategories({ onNavigate }: CartEmptyTopCategoriesProps) {
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;

        const tree = Array.isArray(data?.data) ? (data.data as CategoryNode[]) : [];
        const flattened = flattenCategories(tree)
          .filter((category) => category.productCount > 0)
          .sort((a, b) => b.productCount - a.productCount)
          .slice(0, 10);

        setCategories(flattened);
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasCategories = useMemo(() => categories.length > 0, [categories]);

  return (
    <section className="mt-5 w-full">
      <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
        Categorías con más productos
      </p>

      {loading ? (
        <div className="h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50/60" />
      ) : hasCategories ? (
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogo?categoria=${encodeURIComponent(category.slug)}`}
              onClick={onNavigate}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">{category.name}</p>
              <p className="text-[11px] text-slate-500">{category.productCount} productos</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50/60" />
      )}
    </section>
  );
}
