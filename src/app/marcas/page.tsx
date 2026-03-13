import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 3600; // ⚡ Bolt: Cache brands list for 1 hour to prevent expensive product counting queries

// Brand data type
type BrandWithCount = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  _count: { products: number };
};

// Featured brands for hero section
const featuredBrands = [
  { name: "Faber-Castell", color: "#4CAF50" },
  { name: "Staedtler", color: "#E53935" },
  { name: "BIC", color: "#FFB300" },
  { name: "Sharpie", color: "#1565C0" },
  { name: "Crayola", color: "#7B1FA2" },
];

export default async function MarcasPage() {
  let brands: BrandWithCount[] = [];
  let totalProducts = 0;

  try {
    brands = await db.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: { where: { isActive: true } } } }
      },
      orderBy: { name: "asc" }
    });
    totalProducts = brands.reduce((acc, brand) => acc + brand._count.products, 0);
  } catch (error) {
    console.error("MarcasPage query failed", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Modern Gradient with Floating Elements */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0D4DAA] via-[#0A3D8A] to-[#062D6A] text-white">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating Circles */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#E89A00]/10 rounded-full blur-3xl animate-float-medium" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float-fast" />
            
            {/* Grid Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 animate-fade-in-up">
                <span className="w-2 h-2 bg-[#E89A00] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white/90">Distribuidor autorizado</span>
              </div>

              {/* Main Title */}
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up animation-delay-100"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E89A00] to-[#FFB74D]">Marcas</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                Distribuidores autorizados de las mejores marcas de papelería en Colombia. 
                Calidad garantizada para tu creatividad.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-12 animate-fade-in-up animation-delay-300">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {brands.length}+
                  </div>
                  <div className="text-sm text-white/60 mt-1">Marcas</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden md:block" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {totalProducts}+
                  </div>
                  <div className="text-sm text-white/60 mt-1">Productos</div>
                </div>
                <div className="w-px h-12 bg-white/20 hidden md:block" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                    15+
                  </div>
                  <div className="text-sm text-white/60 mt-1">Años de experiencia</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path 
                d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Featured Brands Marquee */}
        <section className="py-8 bg-white overflow-hidden border-b border-gray-100">
          <div className="flex items-center gap-4 animate-marquee">
            {[...featuredBrands, ...featuredBrands, ...featuredBrands].map((brand, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 px-6 py-2 bg-gray-50 rounded-full whitespace-nowrap"
              >
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: brand.color }}
                />
                <span className="text-sm font-medium text-gray-700">{brand.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Brands Grid Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Explora nuestras marcas
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Cada marca representa nuestro compromiso con la calidad y la excelencia en productos de papelería.
              </p>
            </div>

            {/* Brands Grid - Modern Card Design */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  href={`/catalogo?marca=${brand.slug}`}
                  className="group relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Container */}
                  <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 
                                  transition-all duration-500 ease-out
                                  hover:border-[#0D4DAA]/30 hover:shadow-xl hover:shadow-[#0D4DAA]/10
                                  hover:-translate-y-1 group-hover:scale-[1.02]">
                    
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0D4DAA]/0 to-[#E89A00]/0 
                                    group-hover:from-[#0D4DAA]/5 group-hover:to-[#E89A00]/5 
                                    transition-all duration-500 rounded-2xl" />

                    {/* Logo Container */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 
                                    flex items-center justify-center p-6 md:p-8 overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,77,170,0.05),transparent_70%)]" />
                      </div>

                      {/* Logo Image */}
                      <img
                        src={brand.logo || `https://picsum.photos/seed/${brand.slug}/200/200`}
                        alt={brand.name}
                        className="relative w-full h-full object-contain 
                                   transition-all duration-500 ease-out
                                   group-hover:scale-110 group-hover:brightness-110
                                   filter grayscale-[20%] group-hover:grayscale-0"
                      />

                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute -inset-full top-0 left-0 w-1/2 h-full 
                                        bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                        transform -skew-x-12 group-hover:translate-x-[200%] 
                                        transition-transform duration-1000 ease-out" />
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="relative px-4 py-4 bg-white border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#0D4DAA] 
                                         transition-colors duration-300 truncate text-sm md:text-base">
                            {brand.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#E89A00] rounded-full" />
                            {brand._count.products} productos
                          </p>
                        </div>
                        
                        {/* Arrow Icon */}
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#0D4DAA] 
                                        flex items-center justify-center
                                        transition-all duration-300 transform group-hover:translate-x-1">
                          <svg 
                            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Trust Card 1 */}
              <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0D4DAA] to-[#0A3D8A] 
                                flex items-center justify-center text-white">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Productos Originales</h3>
                <p className="text-sm text-gray-500">100% garantía de autenticidad en todas nuestras marcas</p>
              </div>

              {/* Trust Card 2 */}
              <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#E89A00] to-[#C67A00] 
                                flex items-center justify-center text-white">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Entrega Rápida</h3>
                <p className="text-sm text-gray-500">Envíos a todo Colombia en tiempo récord</p>
              </div>

              {/* Trust Card 3 */}
              <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#25D366] to-[#1DA851] 
                                flex items-center justify-center text-white">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Soporte Experto</h3>
                <p className="text-sm text-gray-500">Asesoría personalizada para tu negocio</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Modern Design */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7EFEF] via-white to-[#FFF8F0]" />
          
          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#0D4DAA]/5 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#E89A00]/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0D4DAA] to-[#0A3D8A] 
                              flex items-center justify-center text-white shadow-lg shadow-[#0D4DAA]/25">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <h2 
                className="text-2xl md:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                ¿Buscas una marca específica?
              </h2>
              
              <p className="text-gray-500 mb-8 text-lg max-w-xl mx-auto">
                Si no encuentras la marca que buscas, contáctanos. Podemos conseguirla para ti.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild 
                  className="bg-[#0D4DAA] hover:bg-[#0A3D8A] text-white px-8 py-6 text-lg
                             shadow-lg shadow-[#0D4DAA]/25 hover:shadow-xl hover:shadow-[#0D4DAA]/30
                             transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Link href="/contacto" className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contáctanos
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline"
                  className="border-2 border-[#0D4DAA] text-[#0D4DAA] hover:bg-[#0D4DAA] hover:text-white
                             px-8 py-6 text-lg transition-all duration-300"
                >
                  <Link href="/catalogo" className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Ver Catálogo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
