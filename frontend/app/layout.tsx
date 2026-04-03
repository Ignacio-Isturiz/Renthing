import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import "./components/layout/Header.css";
import "./components/layout/Footer.css";
import "./components/sections/Hero.css";
import "./components/sections/Catalog.css";
import "./components/sections/Recommendations.css";
import "./components/sections/AboutUs.css";
import "./components/sections/FAQ.css";
import "./components/ui/Pagination.css";
import "./components/auth/AuthModal.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Renthing | Alquiler colaborativo de productos",
  description:
    "Publica, alquila y gestiona productos de forma segura. La plataforma de alquiler colaborativo con verificación, depósitos inteligentes y contratos digitales.",
  keywords: [
    "alquiler",
    "renta",
    "productos",
    "marketplace",
    "alquiler colaborativo",
    "Renthing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={nunito.variable}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
