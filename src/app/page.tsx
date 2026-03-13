import { db } from "@/lib/db";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { HeroSearchBar } from "@/components/store/hero-search-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Building2,
  Users,
  Truck,
  HeadphonesIcon,
  FileText,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  ArrowRight,
  Package,
  BookOpen,
  Palette,
  Monitor,
  LayoutGrid,
  Star,
  Shield,
  Timer,
  TrendingUp
} from "lucide-react";

export const revalidate = 3600; // ⚡ Bolt: Cache homepage for 1 hour to prevent DB queries on every hit

// Product Lines Data
const productLines = [
  {
    icon: BookOpen,
    title: "Escolar",
    description: "Material didáctico, cuadernos, crayones y todo el back-to-school para instituciones educativas.",
    clients: "Colegios, Institutos, Papelerías",
    cta: "Ver línea escolar",
    href: "/catalogo?categoria=escolar",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    icon: Building2,
    title: "Oficina",
    description: "Insumos corporativos, papelería institucional y todo para la operación diaria de empresas.",
    clients: "Empresas, Oficinas, Instituciones",
    cta: "Ver línea oficina",
    href: "/catalogo?categoria=oficina",
    gradient: "from-slate-600 to-slate-700"
  },
  {
    icon: Palette,
    title: "Arte y Manualidades",
    description: "Materiales artísticos de calidad para proyectos creativos y talleres.",
    clients: "Escuelas de arte, Talleres, Creativos",
    cta: "Ver línea arte",
    href: "/catalogo?categoria=arte-y-manualidades",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    icon: Monitor,
    title: "Tecnología",
    description: "Accesorios tecnológicos, consumibles y gadgets para el entorno moderno.",
    clients: "Empresas, Tiendas de tecnología",
    cta: "Ver línea tecnología",
    href: "/catalogo?categoria=tecnologia-y-accesorios",
    gradient: "from-cyan-500 to-cyan-600"
  },
  {
    icon: LayoutGrid,
    title: "Organización",
    description: "Soluciones de almacenamiento, organizadores y ergonomía para espacios de trabajo.",
    clients: "Oficinas, Empresas, Hogares",
    cta: "Ver línea organización",
    href: "/catalogo?categoria=ergonomia-y-organizacion",
    gradient: "from-amber-500 to-amber-600"
  },
];

// Benefits for B2B clients
const b2bBenefits = [
  {
    icon: TrendingUp,
    title: "Precios competitivos",
    description: "Descuentos por volumen desde la primera compra"
  },
  {
    icon: HeadphonesIcon,
    title: "Asesoría dedicada",
    description: "Un asesor comercial para tu negocio"
  },
  {
    icon: Truck,
    title: "Entregas programadas",
    description: "Rutas semanales a tu ciudad"
  },
  {
    icon: FileText,
    title: "Facturación ágil",
    description: "Crédito para clientes calificados"
  },
];

// How it works steps
const processSteps = [
  {
    step: "01",
    title: "Regístrate o contáctanos",
    description: "Cuéntanos sobre tu negocio y necesidades de suministro."
  },
  {
    step: "02",
    title: "Recibe asesoría personalizada",
    description: "Un asesor te ayuda a armar tu pedido según tu inventario y temporada."
  },
  {
    step: "03",
    title: "Confirma tu pedido",
    description: "Revisa disponibilidad, precios y tiempos de entrega."
  },
  {
    step: "04",
    title: "Recibe en tu negocio",
    description: "Entregas programadas en tu ciudad con seguimiento incluido."
  },
];

// Coverage zones
const coverageZones = {
  ejeCafetero: ["Pereira", "Dosquebradas", "Santa Rosa", "Manizales", "Armenia", "Cartago", "La Virginia", "Chinchiná"],
  norteValle: ["Cartago", "Buga", "Tuluá", "Sevilla", "Caicedonia"],
};

// Trust indicators
const trustIndicators = [
  { value: "+20", label: "Años de experiencia" },
  { value: "+1,000", label: "Referencias disponibles" },
  { value: "+500", label: "Clientes activos" },
  { value: "48h", label: "Respuesta máxima" },
];

export default async function HomePage() {
  let brands: Awaited<ReturnType<typeof db.brand.findMany>> = [];

  try {
    brands = await db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
    });
  } catch (error) {
    console.error("HomePage brands query failed", error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - B2B Focus */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          <div className="container mx-auto px-4 py-10 sm:py-16 md:py-24 lg:py-32 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm mb-4 sm:mb-6">
                Papelería Mayorista B2B
              </Badge>
              
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6" style={{ fontFamily: "var(--font-fredoka)" }}>
                Tu aliado estratégico en<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  suministros de papelería
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-sm sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Distribuimos papelería escolar, de oficina y arte a negocios, instituciones y empresas en todo el Eje Cafetero y Norte del Valle.
              </p>
              
              {/* Search Bar */}
              <HeroSearchBar />

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 mb-8 sm:mb-12">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/contacto">
                    Registrarme como mayorista
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  size="lg" 
                  className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                >
                  <a href="https://wa.me/576063335206?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20precios%20mayoristas" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Hablar con un asesor
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-slate-500 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <Link href="/catalogo">
                    Ver catálogo
                  </Link>
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="grid grid-cols-4 gap-2 sm:gap-6 pt-6 sm:pt-8 border-t border-slate-700/50">
                {trustIndicators.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1" style={{ fontFamily: "var(--font-fredoka)" }}>
                      {item.value}
                    </div>
                    <div className="text-[10px] sm:text-sm text-slate-400 leading-tight">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* B2B Benefits Bar */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {b2bBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">{benefit.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Lines - Premium Section */}
        <section className="py-10 sm:py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="max-w-2xl mb-8 sm:mb-12">
              <Badge variant="outline" className="border-slate-300 text-slate-600 mb-3 sm:mb-4">
                Líneas de producto
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                Soluciones para cada tipo de negocio
              </h2>
              <p className="text-slate-500 text-sm sm:text-lg">
                Amplio catálogo organizado por líneas para facilitar tu pedido. Calidad garantizada de las mejores marcas.
              </p>
            </div>

            {/* Product Lines Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {productLines.map((line, index) => (
                <Link 
                  key={index}
                  href={line.href}
                  className="group block"
                >
                  <Card className="h-full border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Gradient Header */}
                      <div className={`h-2 bg-gradient-to-r ${line.gradient}`} />
                      <div className="p-3 sm:p-6">
                        {/* Icon */}
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 group-hover:bg-blue-50 transition-colors">
                          <line.icon className="h-4 w-4 sm:h-6 sm:w-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-sm sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2" style={{ fontFamily: "var(--font-fredoka)" }}>
                          {line.title}
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 hidden sm:block">
                          {line.description}
                        </p>
                        
                        {/* Clients Badge - hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-400">{line.clients}</span>
                        </div>
                        
                        {/* CTA */}
                        <div className="flex items-center text-blue-600 font-medium text-xs sm:text-sm group-hover:text-blue-700">
                          <span className="hidden sm:inline">{line.cta}</span>
                          <span className="sm:hidden">Ver más</span>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* View All CTA */}
            <div className="text-center mt-10 sm:mt-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 sm:px-8">
                <Link href="/catalogo">
                  Ver catálogo completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <Badge variant="outline" className="border-slate-300 text-slate-600 mb-4">
                ¿Cómo funciona?
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                Pedidos simples, sin complicaciones
              </h2>
              <p className="text-slate-500 text-sm sm:text-lg">
                Nuestro proceso está diseñado para que consigas lo que necesitas de forma rápida y con asesoría personalizada.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Connector Line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-transparent" />
                  )}
                  
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow h-full">
                    {/* Step Number */}
                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg shadow-blue-500/20">
                      <span className="text-lg sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                        {step.step}
                      </span>
                    </div>
                    
                    <h3 className="text-sm sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Link href="/contacto">
                  Comenzar ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Coverage & Logistics */}
        <section className="py-10 sm:py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Content */}
              <div>
                <Badge variant="outline" className="border-slate-300 text-slate-600 mb-3 sm:mb-4">
                  Cobertura y logística
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6" style={{ fontFamily: "var(--font-fredoka)" }}>
                  Rutas semanales a tu ciudad
                </h2>
                <p className="text-slate-500 text-sm sm:text-lg mb-6 sm:mb-8">
                  Contamos con logística propia y programada para garantizar entregas puntuales. 
                  Conocemos la región y llegamos donde otros no.
                </p>

                {/* Coverage Details */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Eje Cafetero */}
                  <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Eje Cafetero</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {coverageZones.ejeCafetero.map((city, i) => (
                        <span key={i} className="text-[10px] sm:text-xs bg-white border border-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-slate-600">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Norte del Valle */}
                  <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Norte del Valle</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {coverageZones.norteValle.map((city, i) => (
                        <span key={i} className="text-[10px] sm:text-xs bg-white border border-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-slate-600">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logistics Benefits */}
                <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span>Entregas programadas</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span>Seguimiento en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span>Fletes competitivos</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span>Otros destinos bajo pedido</span>
                  </div>
                </div>
              </div>

              {/* Visual */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12">
                  {/* Map Placeholder */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="aspect-video bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500 mx-auto mb-2 sm:mb-3" />
                        <p className="text-slate-500 font-medium text-sm sm:text-base">Zona de cobertura</p>
                        <p className="text-xs sm:text-sm text-slate-400">Eje Cafetero + Norte del Valle</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-fredoka)" }}>2-5</div>
                      <div className="text-[10px] sm:text-xs text-slate-500">Días hábiles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-fredoka)" }}>15+</div>
                      <div className="text-[10px] sm:text-xs text-slate-500">Ciudades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-fredoka)" }}>100%</div>
                      <div className="text-[10px] sm:text-xs text-slate-500">Rastreable</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client Types */}
        <section className="py-10 sm:py-16 md:py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <Badge className="bg-white/10 text-white border border-white/20 mb-3 sm:mb-4">
                ¿Para quién es?
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                Diseñado para negocios como el tuyo
              </h2>
              <p className="text-slate-400 text-sm sm:text-lg">
                Atendemos diferentes tipos de clientes con necesidades específicas de suministro.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { icon: Building2, title: "Papelerías", desc: "Inventario variado y precios competitivos para tu vitrina." },
                { icon: BookOpen, title: "Colegios", desc: "Material didáctico y suministros para toda la institución." },
                { icon: Users, title: "Empresas", desc: "Insumos de oficina con facturación y crédito corporativo." },
                { icon: Package, title: "Distribuidores", desc: "Volumen y condiciones especiales para revendedores." },
              ].map((client, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-6 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
                    <client.icon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{client.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">{client.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brands Section - Modern Design */}
        <section className="relative py-16 sm:py-20 md:py-28 overflow-hidden">
          {/* Background with subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#0D4DAA]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#E89A00]/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0D4DAA]/10 to-[#E89A00]/10 
                              backdrop-blur-sm border border-[#0D4DAA]/20 rounded-full px-5 py-2 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E89A00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E89A00]"></span>
                </span>
                <span className="text-sm font-medium text-[#0D4DAA]">Distribuidores autorizados</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" 
                  style={{ fontFamily: "var(--font-fredoka)" }}>
                Trabajamos con las{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D4DAA] to-[#E89A00]">
                  mejores marcas
                </span>
              </h2>
              
              <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                Productos originales con garantía de calidad de fabricantes reconocidos a nivel mundial.
              </p>
            </div>

            {/* Brands Grid - Modern Card Design */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  href={`/catalogo?marca=${brand.slug}`}
                  className="group relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 
                                  transition-all duration-500 ease-out
                                  hover:border-[#0D4DAA]/30 hover:shadow-xl hover:shadow-[#0D4DAA]/10
                                  hover:-translate-y-1">
                    
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0D4DAA]/0 to-[#E89A00]/0 
                                    group-hover:from-[#0D4DAA]/5 group-hover:to-[#E89A00]/5 
                                    transition-all duration-500 rounded-2xl" />

                    {/* Logo Container */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white 
                                    flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,77,170,0.05),transparent_70%)]" />
                      </div>

                      {/* Logo Image */}
                      <img
                        src={brand.logo || `https://picsum.photos/seed/${brand.slug}/100/100`}
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

                    {/* Brand Name */}
                    <div className="px-2 py-2 sm:px-3 sm:py-3 bg-white border-t border-gray-50">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-700 group-hover:text-[#0D4DAA] 
                                    transition-colors duration-300 text-center truncate">
                        {brand.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All CTA */}
            <div className="text-center mt-10 sm:mt-12">
              <Button 
                asChild 
                className="bg-white border-2 border-[#0D4DAA] text-[#0D4DAA] hover:bg-[#0D4DAA] hover:text-white
                           px-8 py-6 text-base sm:text-lg font-medium
                           shadow-lg shadow-[#0D4DAA]/10 hover:shadow-xl hover:shadow-[#0D4DAA]/20
                           transition-all duration-300 hover:-translate-y-0.5"
              >
                <Link href="/marcas" className="flex items-center gap-2">
                  Ver todas las marcas
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust & Guarantees */}
        <section className="py-8 sm:py-16 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {[
                { icon: Shield, title: "Producto original", desc: "Garantía de autenticidad en todas las marcas." },
                { icon: Timer, title: "Respuesta en 48h", desc: "Cotizaciones y respuestas rápidas." },
                { icon: Star, title: "+20 años", desc: "Experiencia en el mercado regional." },
                { icon: HeadphonesIcon, title: "Soporte dedicado", desc: "Un asesor para tu cuenta siempre." },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5 hidden sm:block">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                ¿Listo para optimizar tus suministros?
              </h2>
              <p className="text-blue-100 text-sm sm:text-lg mb-6 sm:mb-8">
                Regístrate como cliente mayorista y accede a precios especiales, 
                crédito comercial y atención personalizada para tu negocio.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-blue-700 hover:bg-blue-50 gap-2 px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base"
                >
                  <Link href="/contacto">
                    Registrarme como mayorista
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10 gap-2 px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base"
                >
                  <a href="tel:6063335206">
                    <Phone className="h-4 w-4" />
                    606 333-5206
                  </a>
                </Button>
              </div>
              
              <p className="text-blue-200 text-xs sm:text-sm mt-4 sm:mt-6">
                ¿Prefieres WhatsApp? Escríbenos al{" "}
                <a href="https://wa.me/576063335206" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  606 333-5206
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
