import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
