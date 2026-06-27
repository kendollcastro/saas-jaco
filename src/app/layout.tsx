import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacó SaaS",
  description: "SaaS modular para negocios en Jacó, Costa Rica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
