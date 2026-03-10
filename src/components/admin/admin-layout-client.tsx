"use client";

import { Sidebar } from "./sidebar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface AdminLayoutClientProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="lg:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
