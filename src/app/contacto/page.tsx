"use client";

import { useState } from "react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle, Loader2 } from "lucide-react";

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      type: formData.get("type"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setIsSuccess(true);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0D4DAA] text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              Contáctanos
            </h1>
            <p className="text-white/80 mt-2">
              Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes posible.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Form */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6" style={{ fontFamily: "var(--font-fredoka)" }}>
                  Envíanos un mensaje
                </h2>

                {isSuccess ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1a1a2e] mb-2">
                      ¡Mensaje enviado!
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Gracias por contactarnos. Te responderemos pronto.
                    </p>
                    <Button onClick={() => setIsSuccess(false)} variant="outline">
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre *</Label>
                        <Input id="name" name="name" required placeholder="Tu nombre" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" placeholder="Tu teléfono" />
                      </div>
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input id="city" name="city" placeholder="Tu ciudad" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="type">Tipo de consulta</Label>
                      <Select name="type" defaultValue="consulta">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consulta">Consulta general</SelectItem>
                          <SelectItem value="cotizacion">Cotización</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        required 
                        rows={5}
                        placeholder="¿En qué podemos ayudarte?" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#0D4DAA] hover:bg-[#0A3D8A]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar mensaje
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6" style={{ fontFamily: "var(--font-fredoka)" }}>
                    Información de contacto
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D4DAA] p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a2e]">Dirección</p>
                        <p className="text-gray-500">Carrera 6 #24-14, Pereira, Risaralda</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D4DAA] p-3 rounded-lg">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a2e]">Teléfono</p>
                        <a href="tel:6063335206" className="text-gray-500 hover:text-[#0D4DAA]">606 333-5206</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D4DAA] p-3 rounded-lg">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a2e]">Email</p>
                        <a href="mailto:info@compusum.co" className="text-gray-500 hover:text-[#0D4DAA]">info@compusum.co</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0D4DAA] p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a2e]">Horario</p>
                        <p className="text-gray-500">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                        <p className="text-gray-500">Sábados: 8:00 AM - 1:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <div className="bg-[#25D366]/10 p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-[#25D366] p-3 rounded-full">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1a2e]">¿Prefieres WhatsApp?</p>
                      <p className="text-gray-500 text-sm">Respuesta inmediata</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                  >
                    <a 
                      href="https://wa.me/576063335206?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Escribir por WhatsApp
                    </a>
                  </Button>
                </div>

                {/* Map placeholder */}
                <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>Mapa de ubicación</p>
                    <p className="text-sm">Carrera 6 #24-14, Pereira</p>
                  </div>
                </div>
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
