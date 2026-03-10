import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { CheckoutFlow } from "@/components/store/checkout-flow";

export const metadata = {
  title: "Realizar pedido | Compusum",
  description: "Finaliza tu pedido en Compusum - Papelería Mayorista",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1
            className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Finalizar pedido
          </h1>
          <CheckoutFlow />
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
