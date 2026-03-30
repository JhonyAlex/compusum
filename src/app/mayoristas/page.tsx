import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { 
  CheckCircle, 
  Truck, 
  CreditCard, 
  Users, 
  Package, 
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  Building2
} from "lucide-react";

export default function MayoristasPage() {
  const benefits = [
    { icon: Package, title: "Precios por volumen", description: "Descuentos especiales desde 12 unidades" },
    { icon: Users, title: "Atención personalizada", description: "Un asesor dedicado para tu negocio" },
    { icon: Truck, title: "Envíos a todo Colombia", description: "Llegamos a todas las ciudades principales" },
    { icon: CreditCard, title: "Múltiples formas de pago", description: "Efectivo, transferencia, crédito" },
  ];

  const steps = [
    { number: "1", title: "Explora el catálogo", description: "Revisa nuestros más de 1000 productos" },
    { number: "2", title: "Selecciona productos", description: "Elige los que necesitas para tu negocio" },
    { number: "3", title: "Cotiza por WhatsApp", description: "Te enviamos precios y disponibilidad" },
    { number: "4", title: "Recibe tu pedido", description: "Entrega en 2-5 días hábiles" },
  ];

  const cities = [
    "Pereira", "Dosquebradas", "Santa Rosa", "Manizales", "Armenia",
    "Medellín", "Bogotá", "Cali", "Barranquilla", "Cartagena"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-r from-primary to-blue-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                  ¿Eres mayorista?
                </h1>
                <p className="text-lg text-white/80 mb-8">
                  Distribuimos papelería al por mayor a todo Colombia. 
                  Manejamos precios especiales para tiendas, colegios, empresas e instituciones.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white gap-2">
                    <a href="https://wa.me/576063335206?text=Hola%2C%20soy%20mayorista%20y%20quiero%20cotizar" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      Cotizar por WhatsApp
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-primary">
                    <Link href="/catalogo">Ver catálogo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <Image
                  src="https://picsum.photos/seed/wholesale-boxes/600/400"
                  alt="Ventas por mayor"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-secondary rounded-xl">
                  <div className="bg-primary p-3 rounded-lg flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Buy */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                ¿Cómo comprar?
              </h2>
              <p className="text-gray-500 mt-2">Proceso simple y rápido para mayoristas</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="font-heading w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-accent/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                Zonas de envío
              </h2>
              <p className="text-gray-500 mt-2">Llegamos a las principales ciudades de Colombia</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {cities.map((city, index) => (
                <div key={index} className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {city}
                </div>
              ))}
              <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium">
                ¡Y más ciudades!
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para hacer tu pedido mayorista?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Escríbenos por WhatsApp y recibe cotización personalizada para tu negocio o institución.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white gap-2 text-lg px-8"
            >
              <a href="https://wa.me/576063335206?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20ventas%20por%20mayor" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-6 w-6" />
                Contactar por WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
