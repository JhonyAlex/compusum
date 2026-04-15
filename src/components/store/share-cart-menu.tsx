"use client";

import { Share2, Link2, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore, getSubtotal } from "@/stores/cart-store";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export function ShareCartMenu() {
  const items = useCartStore((s) => s.items);
  const savedCartUuid = useCartStore((s) => s.savedCartUuid);
  const subtotal = useCartStore(getSubtotal);

  const getCartText = () => {
    let text = "Mi carrito CompuSum:\n\n";
    items.forEach((item, i) => {
      const price = item.product.wholesalePrice || item.product.price;
      const variant = item.product.variantName
        ? ` [Variacion: ${item.product.variantName}]`
        : "";
      text += `${i + 1}. ${item.product.name}${variant} x${item.quantity}`;
      if (price) text += ` - ${formatPrice(price * item.quantity)}`;
      text += "\n";
    });
    if (subtotal > 0) text += `\nSubtotal: ${formatPrice(subtotal)}`;
    if (savedCartUuid) {
      text += `\n\nVer carrito: ${window.location.origin}/carrito/${savedCartUuid}`;
    }
    return text;
  };

  const handleCopyLink = async () => {
    const url = savedCartUuid
      ? `${window.location.origin}/carrito/${savedCartUuid}`
      : window.location.origin;
    await navigator.clipboard.writeText(url);
    toast.success("Enlace copiado");
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(getCartText())}`;
    window.open(url, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("Mi carrito CompuSum");
    const body = encodeURIComponent(getCartText());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
          <Share2 className="h-3.5 w-3.5" />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareEmail} className="gap-2 cursor-pointer">
          <Mail className="h-4 w-4 text-blue-600" />
          Correo electrónico
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4 text-slate-600" />
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
