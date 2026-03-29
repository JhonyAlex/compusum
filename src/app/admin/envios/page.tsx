import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function AdminEnviosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;

  const [routes, departments] = await Promise.all([
    db.shippingRoute.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        cities: {
          orderBy: { name: "asc" },
          include: {
            shippingRoute: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
  ]);

  const cities = departments.flatMap((d) =>
    d.cities.map((c) => ({
      id: c.id,
      name: c.name,
      departmentName: d.name,
      shippingRouteId: c.shippingRouteId,
      shippingRouteName: c.shippingRoute?.name || null,
      isActive: c.isActive,
    }))
  );

  async function createRoute(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const estimatedDaysMin = Number(formData.get("estimatedDaysMin") || 0);
    const estimatedDaysMax = Number(formData.get("estimatedDaysMax") || 0);
    const shippingCompany = String(formData.get("shippingCompany") || "").trim() || null;
    const notes = String(formData.get("notes") || "").trim() || null;
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const departureDateRaw = String(formData.get("departureDate") || "").trim();
    const cutOffTimeRaw = String(formData.get("cutOffTime") || "").trim();

    if (!name || estimatedDaysMin < 0 || estimatedDaysMax < 0 || estimatedDaysMax < estimatedDaysMin) {
      redirect("/admin/envios?error=route-invalid");
    }

    await db.shippingRoute.create({
      data: {
        name,
        estimatedDaysMin,
        estimatedDaysMax,
        shippingCompany,
        notes,
        sortOrder,
        departureDate: departureDateRaw ? new Date(departureDateRaw) : null,
        cutOffTime: cutOffTimeRaw ? new Date(cutOffTimeRaw) : null,
      },
    });

    revalidatePath("/admin/envios");
    revalidatePath("/api/shipping/cities");
    redirect("/admin/envios?ok=route-created");
  }

  async function updateRoute(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const estimatedDaysMin = Number(formData.get("estimatedDaysMin") || 0);
    const estimatedDaysMax = Number(formData.get("estimatedDaysMax") || 0);
    const shippingCompany = String(formData.get("shippingCompany") || "").trim() || null;
    const notes = String(formData.get("notes") || "").trim() || null;
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const departureDateRaw = String(formData.get("departureDate") || "").trim();
    const cutOffTimeRaw = String(formData.get("cutOffTime") || "").trim();
    const isActive = formData.get("isActive") === "on";

    if (!id || estimatedDaysMin < 0 || estimatedDaysMax < 0 || estimatedDaysMax < estimatedDaysMin) {
      redirect("/admin/envios?error=route-update-invalid");
    }

    await db.shippingRoute.update({
      where: { id },
      data: {
        estimatedDaysMin,
        estimatedDaysMax,
        shippingCompany,
        notes,
        sortOrder,
        isActive,
        departureDate: departureDateRaw ? new Date(departureDateRaw) : null,
        cutOffTime: cutOffTimeRaw ? new Date(cutOffTimeRaw) : null,
      },
    });

    revalidatePath("/admin/envios");
    revalidatePath("/api/shipping/cities");
    redirect("/admin/envios?ok=route-updated");
  }

  async function createDepartment(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const code = String(formData.get("code") || "").trim().toUpperCase();

    if (!name || !code) {
      redirect("/admin/envios?error=department-invalid");
    }

    await db.department.upsert({
      where: { code },
      update: { name, isActive: true },
      create: { name, code, isActive: true },
    });

    revalidatePath("/admin/envios");
    revalidatePath("/api/shipping/cities");
    redirect("/admin/envios?ok=department-saved");
  }

  async function createCity(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const departmentId = String(formData.get("departmentId") || "").trim();
    const shippingRouteIdRaw = String(formData.get("shippingRouteId") || "").trim();
    const shippingRouteId = shippingRouteIdRaw || null;

    if (!name || !departmentId) {
      redirect("/admin/envios?error=city-invalid");
    }

    const slug = slugify(name);

    await db.city.upsert({
      where: { slug },
      update: {
        name,
        departmentId,
        shippingRouteId,
        isActive: true,
      },
      create: {
        name,
        slug,
        departmentId,
        shippingRouteId,
        isActive: true,
      },
    });

    revalidatePath("/admin/envios");
    revalidatePath("/api/shipping/cities");
    redirect("/admin/envios?ok=city-saved");
  }

  async function updateCity(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    const shippingRouteIdRaw = String(formData.get("shippingRouteId") || "").trim();
    const shippingRouteId = shippingRouteIdRaw || null;
    const isActive = formData.get("isActive") === "on";

    if (!id) {
      redirect("/admin/envios?error=city-update-invalid");
    }

    await db.city.update({
      where: { id },
      data: {
        shippingRouteId,
        isActive,
      },
    });

    revalidatePath("/admin/envios");
    revalidatePath("/api/shipping/cities");
    redirect("/admin/envios?ok=city-updated");
  }

  return (
    <div>
      <Header title="Envíos" subtitle="Gestiona rutas, departamentos y ciudades" />

      <div className="p-4 sm:p-6 space-y-6">
        {params.ok && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Cambios guardados correctamente.
          </div>
        )}

        {params.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Hubo un error validando los datos. Revisa los campos e intenta de nuevo.
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear ruta</CardTitle>
              <CardDescription>
                Define tiempos, transportadora y próxima salida para estimaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createRoute} className="space-y-3">
                <div>
                  <Label htmlFor="route-name">Nombre</Label>
                  <Input id="route-name" name="name" placeholder="Eje Cafetero" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="route-min">Días min</Label>
                    <Input id="route-min" name="estimatedDaysMin" type="number" min={0} defaultValue={1} required />
                  </div>
                  <div>
                    <Label htmlFor="route-max">Días max</Label>
                    <Input id="route-max" name="estimatedDaysMax" type="number" min={0} defaultValue={2} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="route-company">Transportadora</Label>
                  <Input id="route-company" name="shippingCompany" placeholder="Servientrega" />
                </div>
                <div>
                  <Label htmlFor="route-sort">Orden</Label>
                  <Input id="route-sort" name="sortOrder" type="number" min={0} defaultValue={0} />
                </div>
                <div>
                  <Label htmlFor="route-departure">Próxima salida</Label>
                  <Input id="route-departure" name="departureDate" type="datetime-local" />
                </div>
                <div>
                  <Label htmlFor="route-cutoff">Hora de corte</Label>
                  <Input id="route-cutoff" name="cutOffTime" type="datetime-local" />
                </div>
                <div>
                  <Label htmlFor="route-notes">Notas</Label>
                  <Input id="route-notes" name="notes" placeholder="Observaciones" />
                </div>
                <Button type="submit" className="w-full">Guardar ruta</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crear departamento</CardTitle>
              <CardDescription>
                Usa código corto único (ejemplo: RIS, VAL, ANT).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createDepartment} className="space-y-3">
                <div>
                  <Label htmlFor="dept-name">Nombre</Label>
                  <Input id="dept-name" name="name" placeholder="Risaralda" required />
                </div>
                <div>
                  <Label htmlFor="dept-code">Código</Label>
                  <Input id="dept-code" name="code" maxLength={6} placeholder="RIS" required />
                </div>
                <Button type="submit" className="w-full">Guardar departamento</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crear ciudad</CardTitle>
              <CardDescription>
                Asigna una ruta para que el checkout muestre tiempos de envío.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createCity} className="space-y-3">
                <div>
                  <Label htmlFor="city-name">Nombre</Label>
                  <Input id="city-name" name="name" placeholder="Pereira" required />
                </div>
                <div>
                  <Label htmlFor="city-dept">Departamento</Label>
                  <select id="city-dept" name="departmentId" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" required>
                    <option value="">Selecciona...</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="city-route">Ruta</Label>
                  <select id="city-route" name="shippingRouteId" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                    <option value="">Sin ruta</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full">Guardar ciudad</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rutas existentes</CardTitle>
            <CardDescription>
              Ajusta programación para que la estimación de envío en checkout sea precisa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.length === 0 && (
              <p className="text-sm text-slate-500">No hay rutas creadas.</p>
            )}

            {routes.map((route) => (
              <form key={route.id} action={updateRoute} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end border border-slate-200 rounded-lg p-3">
                <input type="hidden" name="id" value={route.id} />

                <div className="md:col-span-2">
                  <Label>Ruta</Label>
                  <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center text-sm">
                    {route.name}
                  </div>
                </div>

                <div>
                  <Label>Días</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Input name="estimatedDaysMin" type="number" min={0} defaultValue={route.estimatedDaysMin} required />
                    <Input name="estimatedDaysMax" type="number" min={0} defaultValue={route.estimatedDaysMax} required />
                  </div>
                </div>

                <div>
                  <Label>Salida</Label>
                  <Input name="departureDate" type="datetime-local" defaultValue={toDateTimeLocal(route.departureDate)} />
                </div>

                <div>
                  <Label>Corte</Label>
                  <Input name="cutOffTime" type="datetime-local" defaultValue={toDateTimeLocal(route.cutOffTime)} />
                </div>

                <div>
                  <Label>Transportadora</Label>
                  <Input name="shippingCompany" defaultValue={route.shippingCompany || ""} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked={route.isActive} />
                    Activa
                  </label>
                  <Input name="sortOrder" type="number" min={0} defaultValue={route.sortOrder} className="w-20" />
                </div>

                <div className="md:col-span-6">
                  <Label>Notas</Label>
                  <Input name="notes" defaultValue={route.notes || ""} />
                </div>

                <div className="md:col-span-1">
                  <Button type="submit" className="w-full">Actualizar</Button>
                </div>
              </form>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ciudades existentes</CardTitle>
            <CardDescription>
              Reasigna ruta o activa/desactiva ciudades visibles en checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cities.length === 0 && (
              <p className="text-sm text-slate-500">No hay ciudades creadas.</p>
            )}

            {cities.map((city) => (
              <form key={city.id} action={updateCity} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-slate-200 rounded-lg p-3">
                <input type="hidden" name="id" value={city.id} />

                <div className="md:col-span-2">
                  <Label>Ciudad</Label>
                  <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between text-sm gap-2">
                    <span>{city.name} ({city.departmentName})</span>
                    {!city.isActive && <Badge variant="outline">Inactiva</Badge>}
                  </div>
                </div>

                <div>
                  <Label>Ruta asignada</Label>
                  <select
                    name="shippingRouteId"
                    defaultValue={city.shippingRouteId || ""}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Sin ruta</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isActive" defaultChecked={city.isActive} />
                  <span className="text-sm">Activa</span>
                </div>

                <div>
                  <Button type="submit" className="w-full">Guardar</Button>
                </div>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
