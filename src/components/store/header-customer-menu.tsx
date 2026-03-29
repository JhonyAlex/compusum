"use client";

import Link from "next/link";
import { useState } from "react";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { LoginModal } from "@/components/store/login-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

export function HeaderCustomerMenu() {
  const { customer, loading, logout } = useCustomerAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!customer) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLoginOpen(true)}
          className="text-slate-600 hover:text-slate-900"
        >
          <User className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Mi Cuenta</span>
        </Button>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-slate-900"
        >
          <User className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline text-xs">{customer.name?.split(" ")[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-slate-900">
          {customer.name}
        </div>
        {customer.phone && (
          <div className="px-2 text-xs text-slate-600 mb-2">
            +57 {customer.phone}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/mi-cuenta" className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Mi Cuenta y Pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
