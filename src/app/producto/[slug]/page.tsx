import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { 
  MessageCircle, 
  Share2, 
  Minus, 
  Plus, 
  Star,
  Sparkles,
  Truck,
  Shield,
  ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { brand: true, category: true }
  });

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} | Compusum`,
    description: product.shortDescription || product.description?.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: {
        include: { parent: true }
      },
      images: { orderBy: { sortOrder: "asc" } }
    }
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Get related products
  const relatedProducts = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id }
    },
    include: { brand: true, category: true },
    take: 4
  });

  // Increment view count
  await db.product.update({
    where: { id: product.id },
    data: { viewsCount: { increment: 1 } }
  });

  const whatsappMessage = `Hola, quiero cotizar: ${product.name}${product.sku ? ` (Ref: ${product.sku})` : ""}`;
  const whatsappUrl = `https://wa.me/576063335206?text=${encodeURIComponent(whatsappMessage)}`;

  const stockStatusColors = {
    disponible: "bg-green-500",
    agotado: "bg-gray-500",
    por_pedido: "bg-[#E89A00]"
  };

  const stockStatusLabels = {
    disponible: "Disponible",
    agotado: "Agotado",
    por_pedido: "Bajo pedido"
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-[#F7EFEF] py-3">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#0D4DAA]">Inicio</Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              {product.category?.parent && (
                <>
                  <Link href={`/catalogo?categoria=${product.category.parent.slug}`} className="text-gray-500 hover:text-[#0D4DAA]">
                    {product.category.parent.name}
                  </Link>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </>
              )}
              <Link href={`/catalogo?categoria=${product.category?.slug}`} className="text-gray-500 hover:text-[#0D4DAA]">
                {product.category?.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-[#1a1a2e] font-medium truncate">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product Detail */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${product.slug}/800/800`}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.isNew && (
                      <Badge className="bg-green-500 text-white gap-1">
                        <Sparkles className="h-3 w-3" />
                        Nuevo
                      </Badge>
                    )}
                    {product.isFeatured && (
                      <Badge className="bg-[#E89A00] text-white gap-1">
                        <Star className="h-3 w-3" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0D4DAA] transition-all"
                    >
                      <Image
                        src={`https://picsum.photos/seed/${product.slug}-${i}/200/200`}
                        alt={`${product.name} - Imagen ${i}`}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Brand */}
                {product.brand && (
                  <Link 
                    href={`/marcas/${product.brand.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D4DAA]"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="font-bold text-[#0D4DAA]">{product.brand.name.charAt(0)}</span>
                    </div>
                    {product.brand.name}
                  </Link>
                )}

                {/* Name */}
                <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]" style={{ fontFamily: "var(--font-fredoka)" }}>
                  {product.name}
                </h1>

                {/* SKU & Stock */}
                <div className="flex items-center gap-4">
                  {product.sku && (
                    <span className="text-sm text-gray-500">
                      Ref: {product.sku}
                    </span>
                  )}
                  <Badge className={`${stockStatusColors[product.stockStatus as keyof typeof stockStatusColors]} text-white`}>
                    {stockStatusLabels[product.stockStatus as keyof typeof stockStatusLabels]}
                  </Badge>
                </div>

                {/* Prices */}
                <div className="bg-[#F7EFEF] rounded-xl p-6">
                  {product.price && (
                    <p className="text-gray-500 line-through mb-1">
                      Precio referencia: {formatPrice(product.price)}
                    </p>
                  )}
                  {product.wholesalePrice && (
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-bold text-[#0D4DAA]">
                        {formatPrice(product.wholesalePrice)}
                      </p>
                      <Badge className="bg-[#E89A00] text-white">
                        Precio mayorista
                      </Badge>
                    </div>
                  )}
                  {product.minWholesaleQty && (
                    <p className="text-sm text-gray-500 mt-2">
                      Válido desde {product.minWholesaleQty} unidades
                    </p>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-gray-600">
                    {product.shortDescription}
                  </p>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2 flex-1"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      Cotizar por WhatsApp
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[#0D4DAA] text-[#0D4DAA] hover:bg-[#0D4DAA] hover:text-white gap-2"
                  >
                    <Share2 className="h-5 w-5" />
                    Compartir
                  </Button>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0D4DAA]/10 p-2 rounded-lg">
                      <Truck className="h-5 w-5 text-[#0D4DAA]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Envíos a todo Colombia</p>
                      <p className="text-xs text-gray-500">Consultar tiempos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0D4DAA]/10 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-[#0D4DAA]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Garantía de calidad</p>
                      <p className="text-xs text-gray-500">100% original</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-12">
              <Tabs defaultValue="descripcion" className="w-full">
                <TabsList className="w-full justify-start bg-[#F7EFEF] p-1 rounded-lg">
                  <TabsTrigger value="descripcion" className="data-[state=active]:bg-white data-[state=active]:text-[#0D4DAA]">
                    Descripción
                  </TabsTrigger>
                  <TabsTrigger value="envio" className="data-[state=active]:bg-white data-[state=active]:text-[#0D4DAA]">
                    Envío y entregas
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="descripcion" className="mt-6 p-6 bg-white rounded-xl border">
                  <div className="prose prose-sm max-w-none">
                    {product.description ? (
                      <p>{product.description}</p>
                    ) : (
                      <p className="text-gray-500">
                        {product.name} - Producto de alta calidad de la marca {product.brand?.name || "reconocida"}. 
                        Ideal para uso escolar y de oficina.
                      </p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="envio" className="mt-6 p-6 bg-white rounded-xl border">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-[#0D4DAA] mt-0.5" />
                      <div>
                        <p className="font-medium">Envíos a todo Colombia</p>
                        <p className="text-sm text-gray-500">
                          Realizamos envíos a todas las ciudades principales. El tiempo de entrega 
                          estimado es de 2-5 días hábiles dependiendo de la ubicación.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-[#25D366] mt-0.5" />
                      <div>
                        <p className="font-medium">Cotización personalizada</p>
                        <p className="text-sm text-gray-500">
                          Escríbenos por WhatsApp para conocer los costos de envío a tu ciudad 
                          y los descuentos por volumen disponibles.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-[#F7EFEF]">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-8" style={{ fontFamily: "var(--font-fredoka)" }}>
                También te puede interesar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
