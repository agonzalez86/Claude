import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LATAM BOX - Sistema de Gestión de Inventario",
  description: "Sistema de gestión de inventario de contenedores marítimos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
