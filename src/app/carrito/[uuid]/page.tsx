import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { notFound } from "next/navigation";
import { SharedCartView } from "@/components/store/shared-cart-view";
import { isGlobalCatalogModeEnabled } from "@/lib/catalog-mode";
import { getSessionPricingContext } from "@/lib/pricing-context";
import { attachResolvedPricesToCartItems } from "@/lib/pricing";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { uuid } = await params;
  const cart = await db.cart.findUnique({
    where: { uuid },
    include: { _count: { select: { items: true } } },
  });

  if (!cart) return { title: "Carrito no encontrado" };

  return {
    title: `Carrito${cart.customerName ? ` de ${cart.customerName}` : ""} | Compusum`,
    description: `Carrito con ${cart._count.items} productos - Compusum Papelería Mayorista`,
  };
}

export default async function SharedCartPage({ params }: PageProps) {
  const { uuid } = await params;
  const catalogMode = await isGlobalCatalogModeEnabled();

  const cart = await db.cart.findUnique({
    where: { uuid },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: { select: { name: true, slug: true, catalogMode: true } },
              category: { select: { name: true, slug: true, catalogMode: true } },
            },
          },
        },
      },
      city: {
        include: {
          department: true,
          shippingRoute: true,
        },
      },
    },
  });

  if (!cart || !cart.isActive) {
    notFound();
  }

  // Motor único de precios: resolvedPrice por VISOR (sesión server-side).
  // Un invitado que abre un carrito compartido ve su precio autorizado,
  // nunca el precio de perfil del dueño.
  let viewerCart: typeof cart = cart;
  try {
    const pricingCtx = await getSessionPricingContext();
    viewerCart = await attachResolvedPricesToCartItems(cart, pricingCtx);
  } catch (error) {
    console.error("Shared cart price resolution failed", error);
  }

  // Serialize for client component
  const cartData = {
    uuid: viewerCart.uuid,
    customerName: viewerCart.customerName,
    customerEmail: viewerCart.customerEmail,
    customerPhone: viewerCart.customerPhone,
    customerCompany: viewerCart.customerCompany,
    notes: viewerCart.notes,
    subtotal: viewerCart.subtotal,
    status: viewerCart.status,
    city: viewerCart.city
      ? {
          name: viewerCart.city.name,
          department: viewerCart.city.department.name,
          shippingRoute: viewerCart.city.shippingRoute
            ? {
                name: viewerCart.city.shippingRoute.name,
                estimatedDaysMin: viewerCart.city.shippingRoute.estimatedDaysMin,
                estimatedDaysMax: viewerCart.city.shippingRoute.estimatedDaysMax,
                shippingCompany: viewerCart.city.shippingRoute.shippingCompany,
              }
            : null,
        }
      : null,
    items: viewerCart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      resolvedPrice: (item as any).resolvedPrice ?? null,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        variantId: item.variantId,
        variantName: item.variantName,
        variantCode: item.variantCode,
        price: item.product.price,
        wholesalePrice: item.product.wholesalePrice,
        minWholesaleQty: item.product.minWholesaleQty,
        stockStatus: item.product.stockStatus,
        catalogMode: item.product.catalogMode,
        brand: item.product.brand,
        category: item.product.category,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <SharedCartView cart={cartData} catalogMode={catalogMode} />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
