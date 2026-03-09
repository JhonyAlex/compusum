import Link from "next/link";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageCircle,
  Facebook,
  Instagram
} from "lucide-react";

const footerLinks = {
  producto: [
    { name: "Línea Escolar", href: "/catalogo?categoria=escolar" },
    { name: "Línea Oficina", href: "/catalogo?categoria=oficina" },
    { name: "Arte y Manualidades", href: "/catalogo?categoria=arte-y-manualidades" },
    { name: "Tecnología", href: "/catalogo?categoria=tecnologia-y-accesorios" },
    { name: "Organización", href: "/catalogo?categoria=ergonomia-y-organizacion" },
  ],
  empresa: [
    { name: "Sobre nosotros", href: "/nosotros" },
    { name: "Marcas", href: "/marcas" },
    { name: "Cobertura", href: "/nosotros#cobertura" },
    { name: "Trabaja con nosotros", href: "/contacto" },
  ],
  soporte: [
    { name: "Contacto", href: "/contacto" },
    { name: "Registrarme como mayorista", href: "/contacto" },
    { name: "Solicitar catálogo", href: "/contacto" },
    { name: "Preguntas frecuentes", href: "/contacto" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-fredoka)" }}>C</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-fredoka)" }}>
                  Compusum
                </span>
                <span className="block text-xs text-slate-400">Papelería Mayorista</span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              Más de 20 años como su aliado estratégico en suministros de papelería 
              escolar y de oficina en el Eje Cafetero y Norte del Valle.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>Carrera 6 #24-14, Pereira, Risaralda</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-500" />
                <a href="tel:6063335206" className="text-slate-400 hover:text-white transition-colors">
                  606 333-5206
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href="mailto:info@compusum.com" className="text-slate-400 hover:text-white transition-colors">
                  info@compusum.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>L-V: 8am - 6pm | S: 8am - 1pm</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Producto</h4>
            <ul className="space-y-2.5">
              {footerLinks.producto.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Empresa</h4>
            <ul className="space-y-2.5">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Soporte</h4>
            <ul className="space-y-2.5">
              {footerLinks.soporte.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social & WhatsApp */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Síguenos:</span>
              <a 
                href="https://instagram.com/compusumsas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Instagram className="h-4 w-4 text-slate-400" />
              </a>
              <a 
                href="https://facebook.com/CompusumSAS"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Facebook className="h-4 w-4 text-slate-400" />
              </a>
              <a 
                href="https://wa.me/576063335206"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-white" />
              </a>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/576063335206?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20precios%20mayoristas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <span>¿Necesitas ayuda?</span>
              <span className="text-green-400 font-medium">Escríbenos por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <p>
              © {currentYear} Compusum S.A.S. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-1">
                Hecho en <span className="text-slate-400">Pereira, Colombia</span>
              </p>
              <Link 
                href="/admin/login" 
                className="text-slate-600 hover:text-slate-400 transition-colors text-xs"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
