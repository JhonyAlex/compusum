"use client";

import { Sidebar } from "./sidebar";
import { ReactNode } from "react";

interface AdminLayoutClientProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
