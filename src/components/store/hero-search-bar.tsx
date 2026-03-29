"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/catalogo?buscar=${encodeURIComponent(q)}`);
    } else {
      router.push("/catalogo");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md mx-auto mt-6 sm:mt-8"
    >
      <div className="relative flex-1">
        <label htmlFor="hero-search" className="sr-only">
          Buscar productos
        </label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <Input
          id="hero-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos, marcas, referencias..."
          className="pl-9 pr-3 h-11 rounded-r-none bg-white text-slate-900 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button
        type="submit"
        className="rounded-l-none h-11 bg-blue-600 hover:bg-blue-700 px-5"
      >
        Buscar
      </Button>
    </form>
  );
}
