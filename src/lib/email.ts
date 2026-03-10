import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export async function getOrderNotificationEmail(): Promise<string | null> {
  const setting = await db.setting.findUnique({
    where: { key: "order_notification_email" },
  });
  return setting?.value || null;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCompany: string | null;
  notes: string | null;
  subtotal: number;
  items: {
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number | null;
  }[];
}

export function formatOrderForEmail(data: OrderEmailData): { subject: string; body: string } {
  const subject = `Nuevo pedido ${data.orderNumber} - CompuSum`;

  let body = `NUEVO PEDIDO - COMPUSUM\n`;
  body += `========================\n\n`;
  body += `Número de pedido: ${data.orderNumber}\n\n`;

  body += `DATOS DEL CLIENTE\n`;
  body += `-----------------\n`;
  body += `Nombre: ${data.customerName}\n`;
  if (data.customerCompany) body += `Empresa: ${data.customerCompany}\n`;
  if (data.customerEmail) body += `Email: ${data.customerEmail}\n`;
  if (data.customerPhone) body += `Teléfono: ${data.customerPhone}\n`;
  body += `\n`;

  body += `PRODUCTOS\n`;
  body += `---------\n`;
  data.items.forEach((item, i) => {
    const ref = item.productSku ? ` (Ref: ${item.productSku})` : "";
    const price = item.unitPrice ? ` - ${formatPrice(item.unitPrice)} c/u` : "";
    body += `${i + 1}. ${item.productName}${ref} x${item.quantity}${price}\n`;
  });
  body += `\n`;

  body += `Subtotal: ${formatPrice(data.subtotal)}\n`;

  if (data.notes) {
    body += `\nNOTAS: ${data.notes}\n`;
  }

  return { subject, body };
}
