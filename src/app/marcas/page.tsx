import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MarcasPage() {
  let brands: Awaited<ReturnType<typeof db.brand.findMany<{ where: { isActive: boolean }, include: { _count: { select: { products: { where: { isActive: boolean } } } } } }>>> = [];

  try {
    brands = await db.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: { where: { isActive: true } } } }
      },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("MarcasPage query failed", error);
  }



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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/catalogo?marca=${brand.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-square bg-gray-50 flex items-center justify-center p-5">
                    <img
                      src={brand.logo || `https://picsum.photos/seed/${brand.slug}/200/200`}
                      alt={brand.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-50">
                    <p className="font-semibold text-sm text-gray-900 truncate">{brand.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{brand._count.products} productos</p>
                  </div>
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
