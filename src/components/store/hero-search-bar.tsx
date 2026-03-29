"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  categoryName: string | null;
}

export function HeroSearchBar() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useDebouncedSearch(300);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const q = query.trim();
    if (q) {
      router.push(`/catalogo?buscar=${encodeURIComponent(q)}`);
    } else {
      router.push("/catalogo");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto mt-6 sm:mt-8">
      <form onSubmit={handleSubmit} className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length >= 2) setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Buscar productos, marcas, referencias..."
            className="pl-9 pr-3 h-11 rounded-r-none bg-white text-slate-900 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
          )}
        </div>
        <Button
          type="submit"
          className="rounded-l-none h-11 bg-blue-600 hover:bg-blue-700 px-5"
        >
          Buscar
        </Button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={`/producto/${s.slug}`}
              onClick={() => setShowSuggestions(false)}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                {s.categoryName && (
                  <p className="text-xs text-slate-400">{s.categoryName}</p>
                )}
              </div>
              {s.sku && (
                <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{s.sku}</span>
              )}
            </Link>
          ))}
          <Link
            href={`/catalogo?buscar=${encodeURIComponent(query)}`}
            onClick={() => setShowSuggestions(false)}
            className="block px-4 py-2.5 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            Ver todos los resultados
          </Link>
        </div>
      )}
    </div>
  );
}
