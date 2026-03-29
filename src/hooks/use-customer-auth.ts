"use client";

import { useEffect, useState } from "react";

interface CustomerUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario actual al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setCustomer(data.data);
          }
        }
      } catch {
        // No autenticado
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginWithPhone = async (phone: string, otpCode: string) => {
    const res = await fetch("/api/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otpCode }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al iniciar sesión");
    }

    const data = await res.json();
    if (data.success && data.data?.user) {
      setCustomer(data.data.user);
      return data.data.user;
    }

    throw new Error("Respuesta inválida del servidor");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignorar errores de logout
    }
    setCustomer(null);
  };

  return { customer, loading, loginWithPhone, logout };
}
