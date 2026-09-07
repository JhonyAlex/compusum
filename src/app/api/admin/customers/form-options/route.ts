import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { listActiveAgents, listActivePriceProfiles } from "@/lib/customers-admin";

// GET /api/admin/customers/form-options - agentes AGENT activos + perfiles activos
// para los selectores del formulario del maestro de clientes.
export async function GET() {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const [agents, profiles] = await Promise.all([
      listActiveAgents(),
      listActivePriceProfiles(),
    ]);

    return NextResponse.json({ success: true, data: { agents, profiles } });
  } catch (err) {
    console.error("Error loading form options:", err);
    return NextResponse.json(
      { success: false, error: "Error al cargar opciones del formulario" },
      { status: 500 }
    );
  }
}
