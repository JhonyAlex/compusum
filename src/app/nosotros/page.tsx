import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Award, Users, Package, MapPin, Phone, Mail, Clock, Target, Eye, Heart } from "lucide-react";

export default function NosotrosPage() {
  const stats = [
    { value: "20+", label: "Años de experiencia" },
    { value: "1000+", label: "Referencias" },
    { value: "15+", label: "Marcas distribuidas" },
    { value: "500+", label: "Clientes satisfechos" },
  ];

  const values = [
    { icon: Heart, title: "Compromiso", description: "Nos comprometemos con la calidad y satisfacción de nuestros clientes" },
    { icon: Users, title: "Servicio", description: "Atención personalizada para cada necesidad" },
    { icon: Award, title: "Calidad", description: "Solo trabajamos con marcas reconocidas y certificados" },
    { icon: Package, title: "Variedad", description: "Amplio catálogo para todas tus necesidades" },
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
                  Sobre Compusum
                </h1>
                <p className="text-lg text-white/80 mb-8">
                  Somos una empresa pereirana con más de 20 años de experiencia en el sector de la papelería mayorista. 
                  Nos especializamos en la distribución de útiles escolares y de oficina de las mejores marcas del mercado.
                </p>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white">
                  <Link href="/contacto">Contáctanos</Link>
                </Button>
              </div>
              <div className="relative hidden md:block">
                <Image
                  src="https://picsum.photos/seed/compusum-team/600/400"
                  alt="Equipo Compusum"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="font-heading text-4xl md:text-5xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-gray-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Misión
                </h3>
                <p className="text-gray-600">
                  Proveer soluciones integrales en papelería y útiles escolares a instituciones educativas, 
                  empresas y mayoristas en Colombia, ofreciendo productos de alta calidad, precios competitivos 
                  y un servicio excepcional que supere las expectativas de nuestros clientes.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="bg-accent w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Visión
                </h3>
                <p className="text-gray-600">
                  Ser reconocidos como la papelería mayorista líder en el Eje Cafetero y a nivel nacional, 
                  destacando por nuestra amplia variedad de productos, compromiso con la calidad y 
                  la satisfacción total de nuestros clientes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                Nuestros Valores
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={index} className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-gray-500 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-heading text-3xl font-bold text-foreground mb-6">
                  Visítanos
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-gray-500">Carrera 6 #24-14, Pereira, Risaralda, Colombia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <a href="tel:6063335206" className="text-gray-500 hover:text-primary">606 333-5206</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:info@compusum.co" className="text-gray-500 hover:text-primary">info@compusum.co</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-gray-500">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                      <p className="text-gray-500">Sábados: 8:00 AM - 1:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                <Image
                  src="https://picsum.photos/seed/compusum-store/600/400"
                  alt="Tienda Compusum"
                  fill
                  className="object-cover"
                />
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
