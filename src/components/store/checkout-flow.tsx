"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  ShoppingCart,
  User,
  MapPin,
  CheckCircle2,
  Save,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore, getSubtotal, getItemCount } from "@/stores/cart-store";
import { CartItemRow } from "@/components/store/cart-item-row";
import { CitySelector } from "@/components/store/city-selector";
import { ShareCartMenu } from "@/components/store/share-cart-menu";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

const STEPS = [
  { id: "resumen", label: "Resumen", icon: ShoppingCart },
  { id: "datos", label: "Datos", icon: User },
  { id: "envio", label: "Envío", icon: MapPin },
  { id: "confirmar", label: "Confirmar", icon: CheckCircle2 },
];

export function CheckoutFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("576063335206");
  const [catalogMode, setCatalogMode] = useState(false);
  const items = useCartStore((s) => s.items);
  const customerInfo = useCartStore((s) => s.customerInfo);
  const setCustomerInfo = useCartStore((s) => s.setCustomerInfo);
  const savedCartUuid = useCartStore((s) => s.savedCartUuid);
  const setSavedCartUuid = useCartStore((s) => s.setSavedCartUuid);
  const subtotal = useCartStore(getSubtotal);
  const itemCount = useCartStore(getItemCount);

  // Fetch settings (WhatsApp phone + catalog mode)
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const phone = data.data?.contact?.whatsapp_global?.value;
        if (phone) setWhatsappPhone(phone);
      })
      .catch(() => {});

    fetch("/api/catalog-mode")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCatalogMode(data.data.catalogMode);
      })
      .catch(() => {});
  }, []);

  const next = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSaveCart = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.wholesalePrice || item.product.price,
          })),
          customerName: customerInfo.name || null,
          customerEmail: customerInfo.email || null,
          customerPhone: customerInfo.phone || null,
          customerCompany: customerInfo.company || null,
          cityId: customerInfo.cityId || null,
          notes: customerInfo.notes || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSavedCartUuid(data.data.uuid);
        toast.success("Carrito guardado", {
          description: "Puedes compartir el enlace para que otros lo vean",
        });
      } else {
        toast.error("Error al guardar el carrito");
      }
    } catch {
      toast.error("Error al guardar el carrito");
    } finally {
      setSaving(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const isCatalogQuote = catalogMode;
    let msg = isCatalogQuote ? "*Cotización CompuSum* 📋\n\n" : "*Pedido CompuSum* 🛒\n\n";
    if (customerInfo.name) msg += `*Cliente:* ${customerInfo.name}\n`;
    if (customerInfo.company) msg += `*Empresa:* ${customerInfo.company}\n`;
    if (customerInfo.phone) msg += `*Tel:* ${customerInfo.phone}\n`;
    if (customerInfo.email) msg += `*Email:* ${customerInfo.email}\n`;
    msg += isCatalogQuote ? "\n*Productos a cotizar:*\n" : "\n*Productos:*\n";

    items.forEach((item, i) => {
      const price = item.product.wholesalePrice || item.product.price || 0;
      const ref = item.product.sku ? ` (Ref: ${item.product.sku})` : "";
      msg += `${i + 1}. ${item.product.name}${ref} x${item.quantity}`;
      if (!isCatalogQuote && price) msg += ` - ${formatPrice(price)} c/u`;
      msg += "\n";
    });

    if (!isCatalogQuote && subtotal > 0) msg += `\n*Subtotal:* ${formatPrice(subtotal)}`;
    if (customerInfo.notes) msg += `\n\n*Notas:* ${customerInfo.notes}`;
    return msg;
  };

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(generateWhatsAppMessage())}`;

  const handleCreateOrder = async (sentVia: string) => {
    // First save the cart if not already saved
    let cartId = savedCartUuid;
    if (!cartId) {
      await handleSaveCart();
      cartId = useCartStore.getState().savedCartUuid;
    }
    if (!cartId) {
      toast.error("Error al guardar el carrito");
      return;
    }

    setCreatingOrder(true);
    try {
      // We need the server cart ID, so fetch it
      const cartRes = await fetch(`/api/carts/${cartId}`);
      const cartData = await cartRes.json();
      if (!cartData.success) {
        toast.error("Error al obtener el carrito guardado");
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cartData.data.id,
          customerName: customerInfo.name || "Cliente",
          customerEmail: customerInfo.email || null,
          customerPhone: customerInfo.phone || null,
          customerCompany: customerInfo.company || null,
          cityId: customerInfo.cityId || null,
          notes: customerInfo.notes || null,
          sentVia,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderNumber(data.data.orderNumber);
        toast.success(`Pedido ${data.data.orderNumber} creado`);
      } else {
        toast.error(data.error || "Error al crear pedido");
      }
    } catch {
      toast.error("Error al crear el pedido");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : isCompleted
                    ? "text-green-600 cursor-pointer hover:bg-green-50"
                    : "text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${isCompleted ? "bg-green-300" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 0: Resumen */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {catalogMode ? "Lista de cotización" : "Resumen del pedido"} ({itemCount} productos)
              </h2>
              {catalogMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    📋 <strong>Modo Catálogo:</strong> Los precios serán cotizados personalmente.
                    Completa tus datos para recibir la cotización.
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <CartItemRow key={item.product.id} item={item} hidePrices={catalogMode} />
                ))}
              </div>
              <Separator className="my-4" />
              {catalogMode ? (
                <p className="text-sm text-slate-500 italic">
                  Los precios serán cotizados de forma personalizada
                </p>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-xl font-bold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Precios mayoristas sujetos a confirmación
                  </p>
                </>
              )}
            </div>
          )}

          {/* Step 1: Datos del cliente */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos de contacto</h2>
              <p className="text-sm text-slate-500 mb-4">
                Completa tus datos para que podamos contactarte (opcional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa / Negocio</Label>
                  <Input
                    id="company"
                    placeholder="Nombre del negocio"
                    value={customerInfo.company}
                    onChange={(e) => setCustomerInfo({ company: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="300 000 0000"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ email: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Indicaciones especiales, cantidades personalizadas, etc."
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Envío */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de envío</h2>
              <p className="text-sm text-slate-500 mb-4">
                Selecciona tu ciudad para ver las rutas de envío disponibles
              </p>
              <CitySelector />
            </div>
          )}

          {/* Step 3: Confirmar */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {catalogMode ? "Confirmar solicitud de cotización" : "Confirmar pedido"}
              </h2>

              {/* Summary card */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Productos</span>
                  <span className="font-medium">{itemCount} productos</span>
                </div>
                {customerInfo.name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Cliente</span>
                    <span className="font-medium">{customerInfo.name}</span>
                  </div>
                )}
                {customerInfo.company && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Empresa</span>
                    <span className="font-medium">{customerInfo.company}</span>
                  </div>
                )}
                <Separator />
                {catalogMode ? (
                  <p className="text-sm text-slate-500 italic">
                    Los precios serán cotizados de forma personalizada
                  </p>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Subtotal</span>
                    <span className="text-lg font-bold text-blue-600">{formatPrice(subtotal)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {orderNumber ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-800">Pedido creado</p>
                    <p className="text-sm text-green-700 font-mono">{orderNumber}</p>
                    <p className="text-xs text-green-600 mt-2">
                      Tu pedido ha sido registrado. Te contactaremos pronto.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 gap-2 h-12 text-base"
                      disabled={creatingOrder}
                      onClick={() => {
                        handleCreateOrder("whatsapp");
                        window.open(whatsappUrl, "_blank");
                      }}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {creatingOrder
                        ? "Procesando..."
                        : catalogMode
                        ? "Enviar solicitud de cotización por WhatsApp"
                        : "Enviar pedido por WhatsApp"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleCreateOrder("sistema")}
                      disabled={creatingOrder || saving}
                    >
                      <Save className="h-4 w-4" />
                      {creatingOrder
                        ? "Creando..."
                        : catalogMode
                        ? "Registrar solicitud sin WhatsApp"
                        : "Crear pedido sin WhatsApp"}
                    </Button>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleSaveCart}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Guardando..." : "Solo guardar carrito"}
                  </Button>
                  <ShareCartMenu />
                </div>

                {savedCartUuid && !orderNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">Carrito guardado</p>
                    <p className="text-xs text-blue-600 break-all">
                      {typeof window !== "undefined" && `${window.location.origin}/carrito/${savedCartUuid}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button onClick={next} className="gap-2 bg-blue-600 hover:bg-blue-700">
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
