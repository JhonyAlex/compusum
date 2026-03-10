import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  solicitado: { label: "Solicitado", className: "bg-amber-100 text-amber-700" },
  compartido: { label: "Compartido", className: "bg-blue-100 text-blue-700" },
  recibido: { label: "Recibido", className: "bg-green-100 text-green-700" },
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return <Badge className={config.className}>{config.label}</Badge>;
}
