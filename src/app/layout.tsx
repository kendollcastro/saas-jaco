import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ola Saas",
  description: "SaaS modular para pequeños negocios en Costa Rica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn(manrope.variable)} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
