import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/pwa-register";
import PortalTheme from "@/components/portal-theme";

export const metadata: Metadata = {
  title: "Portal de Socios",
  description: "Portal para socios — gestioná tu membresía y horarios",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Portal de Socios",
  },
  icons: {
    apple: "/api/portal/logo/180",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f6f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalTheme />
      <PwaRegister />
      {children}
    </>
  );
}
