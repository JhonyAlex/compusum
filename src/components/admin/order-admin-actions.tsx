"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface OrderAdminActionsProps {
  orderId: string;
  currentStatus: string;
  webhookSent: boolean;
}

export function OrderAdminActions({ orderId, currentStatus, webhookSent }: OrderAdminActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWebhook = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/webhook`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Webhook enviado exitosamente");
        router.refresh();
      } else {
        toast.error(data.message || "Error al enviar webhook");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-600 mb-1.5 block">Estado del pedido</label>
          <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solicitado">Solicitado</SelectItem>
              <SelectItem value="compartido">Compartido</SelectItem>
              <SelectItem value="recibido">Recibido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full gap-2"
          variant="outline"
          onClick={handleSendWebhook}
          disabled={webhookLoading}
        >
          <Send className="h-4 w-4" />
          {webhookLoading ? "Enviando..." : webhookSent ? "Reenviar a N8N" : "Enviar a N8N"}
        </Button>

        {webhookSent && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Webhook className="h-3 w-3" />
            Webhook enviado previamente
          </p>
        )}
      </CardContent>
    </Card>
  );
}
