import type { Metadata } from "next";
import { Fredoka, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/components/store/cart-provider";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Compusum | Tu Papelería al por Mayor",
  description: "Compusum - Papelería mayorista en Pereira, Colombia. Distribuidores de las mejores marcas de útiles escolares y de oficina. Envíos a todo el país.",
  keywords: ["papelería", "mayorista", "Pereira", "Colombia", "útiles escolares", "oficina", "Compusum"],
  authors: [{ name: "Compusum S.A.S." }],
  openGraph: {
    title: "Compusum | Tu Papelería al por Mayor",
    description: "Papelería mayorista en Pereira, Colombia. Distribuidores de las mejores marcas.",
    url: "https://compusum.co",
    siteName: "Compusum",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compusum | Tu Papelería al por Mayor",
    description: "Papelería mayorista en Pereira, Colombia. Distribuidores de las mejores marcas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fredoka.variable} ${poppins.variable} font-body antialiased bg-background text-foreground`}
      >
        {children}
        <CartProvider />
        <Toaster />
      </body>
    </html>
  );
}
