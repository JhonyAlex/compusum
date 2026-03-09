"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  _count?: {
    products: number;
  };
}

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/catalogo?categoria=${category.slug}`}>
      <Card className="group overflow-hidden border border-gray-100 hover:border-[#0D4DAA]/30 hover:shadow-lg transition-all duration-300 bg-white text-center">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={category.image || `https://picsum.photos/seed/${category.slug}/300/300`}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D4DAA]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-4">
          <div className="text-3xl mb-2">{category.icon || "📁"}</div>
          <h3 className="font-semibold text-[#1a1a2e] group-hover:text-[#0D4DAA] transition-colors" style={{ fontFamily: "var(--font-fredoka)" }}>
            {category.name}
          </h3>
          {category._count && (
            <p className="text-sm text-gray-500 mt-1">
              {category._count.products} productos
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
