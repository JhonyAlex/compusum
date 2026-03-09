"use client";

import { Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="lg:ml-0 ml-12">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-fredoka)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver sitio
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
