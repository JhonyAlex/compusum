import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  // Note: We allow access to /admin/login without auth
  return (
    <AdminLayoutClient user={user || { name: "Usuario", email: "", role: "guest" }}>
      {children}
    </AdminLayoutClient>
  );
}
