"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ open, onOpenChange, onLoginSuccess }: LoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar formato: 10 dígitos
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("El teléfono debe tener 10 dígitos");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+57${cleaned}` }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No fue posible enviar el OTP");
      }

      setPhone(cleaned);
      setStep("otp");

      if (process.env.NODE_ENV !== "production" && data?.data?.debugCode) {
        setError(`En desarrollo, usá OTP: ${data.data.debugCode} para testear`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+57${phone}`,
          otpCode: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al verificar OTP");
      }

      // Éxito
      setPhone("");
      setOtp("");
      setStep("phone");
      onOpenChange(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push("/mis-pedidos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setOtp("");
    setStep("phone");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Iniciar sesión con teléfono</DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "Ingresa tu número de teléfono para acceder a tus pedidos"
              : "Ingresa el código OTP enviado a tu teléfono"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant={error.includes("desarrollo") ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
              <p className="text-xs text-slate-500">Ingresa los 10 dígitos (sin espacios ni símbolos)</p>
            </div>

            <Button type="submit" className="w-full" disabled={phone.length !== 10 || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar OTP"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código OTP</label>
              <p className="text-xs text-slate-500 mb-2">
                Código enviado a <strong>+57 {phone.slice(0, 3)} {phone.slice(3, 6)} {phone.slice(6)}</strong>
              </p>
              <Input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("phone")}
                disabled={loading}
              >
                Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={otp.length !== 6 || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
