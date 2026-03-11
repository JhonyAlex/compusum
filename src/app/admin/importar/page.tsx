import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/admin/header";
import { ImportadorCSV } from "@/components/admin/import-csv";

export default async function AdminImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <>
      <Header
        title="Importador masivo"
        subtitle="Carga productos desde un archivo CSV"
      />
      <ImportadorCSV />
    </>
  );
}
