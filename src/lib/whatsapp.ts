import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

const DEFAULT_PHONE = "576063335206";

export async function getWhatsAppPhone(): Promise<string> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "whatsapp_global" },
    });
    return setting?.value || DEFAULT_PHONE;
  } catch {
    return DEFAULT_PHONE;
  }
}

export interface CartItemForWhatsApp {
  name: string;
  sku?: string | null;
  quantity: number;
  unitPrice?: number | null;
}

export interface CustomerInfoForWhatsApp {
  name?: string;
  company?: string;
  city?: string;
  phone?: string;
}

export function generateCartWhatsAppMessage(
  items: CartItemForWhatsApp[],
  customerInfo?: CustomerInfoForWhatsApp,
  orderNumber?: string
): string {
  let msg = "*Pedido CompuSum* 🛒\n\n";

  if (customerInfo?.name || customerInfo?.company || customerInfo?.city) {
    if (customerInfo.name) msg += `*Cliente:* ${customerInfo.name}\n`;
    if (customerInfo.company) msg += `*Empresa:* ${customerInfo.company}\n`;
    if (customerInfo.city) msg += `*Ciudad:* ${customerInfo.city}\n`;
    if (customerInfo.phone) msg += `*Tel:* ${customerInfo.phone}\n`;
    msg += "\n";
  }

  msg += "*Productos:*\n";
  let subtotal = 0;

  items.forEach((item, i) => {
    const ref = item.sku ? ` (Ref: ${item.sku})` : "";
    const price = item.unitPrice ? ` - ${formatPrice(item.unitPrice)} c/u` : "";
    msg += `${i + 1}. ${item.name}${ref} x${item.quantity}${price}\n`;
    if (item.unitPrice) subtotal += item.unitPrice * item.quantity;
  });

  if (subtotal > 0) {
    msg += `\n*Subtotal:* ${formatPrice(subtotal)}`;
  }

  if (orderNumber) {
    msg += `\n\n*Ref:* ${orderNumber}`;
  }

  return msg;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
