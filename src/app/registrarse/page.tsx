"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RegistrarsePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    taxId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No fue posible crear la cuenta");
      }
      router.push("/mi-cuenta");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Crear cuenta mayorista</CardTitle>
            <CardDescription>
              Regístrate para ver tus precios, guardar carritos y hacer pedidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre / Razón social *</label>
                <Input value={form.name} onChange={update("name")} required maxLength={200} placeholder="Tu nombre o empresa" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo</label>
                  <Input type="email" value={form.email} onChange={update("email")} placeholder="correo@empresa.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    placeholder="3001234567"
                    maxLength={10}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 -mt-2">Debes registrar al menos correo o teléfono.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa (opcional)</label>
                  <Input value={form.company} onChange={update("company")} maxLength={200} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NIT (opcional)</label>
                  <Input value={form.taxId} onChange={update("taxId")} maxLength={50} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña *</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  required
                  minLength={8}
                  maxLength={72}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <div className="text-sm text-center text-slate-600 space-y-1">
                <p>
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/ingresar" className="text-blue-600 hover:underline font-medium">
                    Inicia sesión
                  </Link>
                </p>
                <p>
                  <Link href="/recuperar" className="text-slate-500 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
