import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function MarcasPage() {
  const brands = await db.brand.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } }
    },
    orderBy: { name: "asc" }
  });

  const brandColors = [
    "bg-[#0D4DAA]",
    "bg-[#E89A00]",
    "bg-[#FF6A00]",
    "bg-[#6DA8FF]",
    "bg-[#1a1a2e]",
    "bg-[#25D366]",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0D4DAA] text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              Nuestras Marcas
            </h1>
            <p className="text-white/80 mt-2">
              Distribuidores autorizados de las mejores marcas de papelería en Colombia
            </p>
          </div>
        </section>

        {/* Brands Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  href={`/catalogo?marca=${brand.slug}`}
                  className="group bg-white border rounded-2xl p-6 hover:shadow-xl hover:border-[#0D4DAA]/30 transition-all duration-300"
                >
                  <div className={`w-20 h-20 ${brandColors[index % brandColors.length]} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1a1a2e] text-center group-hover:text-[#0D4DAA] transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    {brand._count.products} productos
                  </p>
                  {brand.website && (
                    <p className="text-xs text-[#0D4DAA] text-center mt-2 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver sitio web
                      <ExternalLink className="h-3 w-3" />
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#F7EFEF]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
              ¿Buscas una marca específica?
            </h2>
            <p className="text-gray-500 mb-6">
              Si no encuentras la marca que buscas, contáctanos. Podemos conseguirla para ti.
            </p>
            <Button asChild className="bg-[#0D4DAA] hover:bg-[#0A3D8A]">
              <Link href="/contacto">Contáctanos</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
