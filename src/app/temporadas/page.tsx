import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeProductImage } from "@/components/store/safe-product-image";
import Link from "next/link";
import { Calendar, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemporadasPage() {
  let seasons: Awaited<ReturnType<typeof db.season.findMany>> = [];

  try {
    seasons = await db.season.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { startDate: "asc" }
    });
  } catch (error) {
    console.error("TemporadasPage query failed", error);
  }

  const now = new Date();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-heading text-3xl md:text-4xl font-bold">
              Temporadas
            </h1>
            <p className="text-white/80 mt-2">
              Productos especiales para cada época del año
            </p>
          </div>
        </section>

        {/* Seasons Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {seasons.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  No hay temporadas activas
                </h2>
                <p className="text-gray-500 mb-6">
                  Próximamente tendremos nuevas temporadas especiales
                </p>
                <Button asChild>
                  <Link href="/catalogo">Ver catálogo completo</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seasons.map((season) => {
                  const isActive = season.startDate && season.endDate
                    ? now >= season.startDate && now <= season.endDate
                    : false;

                  return (
                    <Link
                      key={season.id}
                      href={`/catalogo?temporada=${season.slug}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative h-48 bg-gray-100">
                        <SafeProductImage
                          src=""
                          alt={season.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div 
                          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                          style={{ backgroundColor: season.colorHex || 'var(--color-primary)' }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <h3 className="font-heading text-xl font-bold">
                            {season.name}
                          </h3>
                        </div>
                        {isActive && (
                          <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                            Activa ahora
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        {season.description && (
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                            {season.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Package className="h-4 w-4" />
                            <span>{season._count.products} productos</span>
                          </div>
                          {season.startDate && season.endDate && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(season.startDate).toLocaleDateString('es-CO', { month: 'short' })} - {new Date(season.endDate).toLocaleDateString('es-CO', { month: 'short' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
