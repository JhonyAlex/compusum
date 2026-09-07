"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Login unificado del cliente: contraseña (teléfono/email + password) u OTP
 * por teléfono si el proveedor está configurado.
 */
export default function IngresarPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "otp">("password");

  // Password
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpUnavailable, setOtpUnavailable] = useState(false);

  useEffect(() => {
    // Detecta si OTP está configurado consultando un envío vacío no es posible;
    // el estado se ajusta al intentar enviar (503).
  }, []);

  const completeLogin = () => {
    router.push("/mi-cuenta");
    router.refresh();
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "password", phoneOrEmail: identifier, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Credenciales inválidas");
      }
      completeLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setOtpUnavailable(false);
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+57${cleaned}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) setOtpUnavailable(true);
        throw new Error(data.error || "No fue posible enviar el OTP");
      }
      setOtpSent(true);
      if (process.env.NODE_ENV !== "production" && data?.data?.debugCode) {
        setError(`En desarrollo, usá OTP: ${data.data.debugCode} para testear`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "phone", phone: `+57${cleaned}`, otpCode: otp, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Código inválido");
      }
      completeLogin();
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
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>Accede con tu cuenta mayorista</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={method === "password" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => { setMethod("password"); setError(null); }}
              >
                Contraseña
              </Button>
              <Button
                type="button"
                variant={method === "otp" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => { setMethod("otp"); setError(null); }}
              >
                Teléfono (OTP)
              </Button>
            </div>

            {error && (
              <Alert variant={error.includes("desarrollo") ? "default" : "destructive"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {method === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono o correo</label>
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="3001234567 o correo@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Tu contraseña"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Mantener sesión iniciada por 30 días
                </label>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Iniciar sesión
                </Button>
              </form>
            ) : otpUnavailable ? (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El ingreso por OTP no está configurado. Usa tu contraseña o contacta a tu asesor.
                </AlertDescription>
              </Alert>
            ) : !otpSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-sm border border-r-0 border-slate-300 rounded-l-md">
                      +57
                    </span>
                    <Input
                      type="tel"
                      placeholder="3001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="rounded-l-none"
                      maxLength={10}
                    />
                  </div>
                </div>
                <Button className="w-full" disabled={phone.length !== 10 || loading} onClick={handleSendOtp}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar código
                </Button>
              </div>
            ) : (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código OTP</label>
                  <p className="text-xs text-slate-500">
                    Código enviado a <strong>+57 {phone}</strong>
                  </p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={otp.length !== 4 || loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verificar e ingresar
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setOtpSent(false)}>
                  Volver
                </Button>
              </form>
            )}

            <div className="text-sm text-center text-slate-600 space-y-1 mt-4">
              <p>
                <Link href="/recuperar" className="text-slate-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              <p>
                ¿No tienes cuenta?{" "}
                <Link href="/registrarse" className="text-blue-600 hover:underline font-medium">
                  Regístrate
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
