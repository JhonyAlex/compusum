"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { HeaderCustomerMenu } from "@/components/store/header-customer-menu";
import { 
  Menu, 
  Phone, 
  Mail, 
  MessageCircle,
  ChevronDown,
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CartIconButton } from "@/components/store/cart-icon-button";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Líneas de producto", href: "/catalogo", hasSubmenu: true },
  { name: "Marcas", href: "/marcas" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

const productLines = [
  { name: "Escolar", href: "/catalogo?categoria=escolar", icon: "📚" },
  { name: "Oficina", href: "/catalogo?categoria=oficina", icon: "🏢" },
  { name: "Arte y Manualidades", href: "/catalogo?categoria=arte-y-manualidades", icon: "🎨" },
  { name: "Tecnología", href: "/catalogo?categoria=tecnologia-y-accesorios", icon: "💻" },
  { name: "Organización", href: "/catalogo?categoria=ergonomia-y-organizacion", icon: "📐" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-6">
              <a href="tel:6063335206" aria-label="Llamar al 606 333-5206" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm">
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">606 333-5206</span>
              </a>
              <a href="mailto:info@compusum.co" aria-label="Enviar correo a info@compusum.co" className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm">
                <Mail className="h-3.5 w-3.5" />
                <span>info@compusum.co</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs px-2 py-0.5">
                <Building2 className="h-3 w-3 mr-1" />
                Ventas mayoristas
              </Badge>
              <a 
                href="https://wa.me/576063335206?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20precios%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp para información de precios mayoristas (abre en una nueva pestaña)"
                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/icono.svg"
                alt="Compusum Logo"
                width={40}
                height={40}
                priority
                className="w-10 h-10"
              />
              <div className="hidden sm:block">
                <span className="font-heading text-xl font-bold text-slate-900">
                  Compusum
                </span>
                <span className="block text-[10px] text-slate-400 -mt-1">Papelería Mayorista</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => 
              item.hasSubmenu ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors">
                      {item.name}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-white border-slate-200 shadow-lg">
                    {productLines.map((line) => (
                      <DropdownMenuItem key={line.name} asChild>
                        <Link 
                          href={line.href}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <span>{line.icon}</span>
                          <span>{line.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem asChild className="border-t border-slate-100 mt-1 pt-1">
                      <Link href="/catalogo" className="text-primary font-medium">
                        Ver catálogo completo
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <CartIconButton />

            {/* Customer Menu (Mi Cuenta) */}
            <HeaderCustomerMenu />

            {/* CTA Button */}
            <Button
              asChild
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/contacto">
                Registrarme
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-slate-700" aria-label="Menú principal">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white p-0">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
                <div className="flex flex-col h-full px-4 pt-6 pb-4">
                  {/* Logo */}
                  <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="font-heading text-white font-bold text-lg">C</span>
                    </div>
                    <div>
                      <span className="font-heading text-lg font-bold text-slate-900">
                        Compusum
                      </span>
                      <span className="block text-[10px] text-slate-400">Papelería Mayorista</span>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                    >
                      Inicio
                    </Link>
                    
                    <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Líneas de producto
                    </div>
                    {productLines.map((line) => (
                      <Link
                        key={line.name}
                        href={line.href}
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm flex items-center gap-2 rounded-lg transition-colors"
                      >
                        <span>{line.icon}</span>
                        {line.name}
                      </Link>
                    ))}
                    
                    <Link
                      href="/catalogo"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-primary hover:text-primary/80 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Ver catálogo completo
                    </Link>
                    
                    <Link
                      href="/marcas"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                    >
                      Marcas
                    </Link>
                    
                    <Link
                      href="/nosotros"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                    >
                      Nosotros
                    </Link>
                    
                    <Link
                      href="/contacto"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                    >
                      Contacto
                    </Link>
                  </nav>

                  {/* Bottom Actions */}
                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      <Link href="/contacto" onClick={() => setIsOpen(false)}>
                        Registrarme como mayorista
                      </Link>
                    </Button>
                    
                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <a href="tel:6063335206" className="flex items-center gap-2 hover:text-slate-700">
                        <Phone className="h-4 w-4" />
                        606 333-5206
                      </a>
                      <a 
                        href="https://wa.me/576063335206" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-green-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
