import type { Metadata } from "next";
import PortalTheme from "@/components/portal-theme";

export const metadata: Metadata = {
  title: "Portal de Socios",
  description: "Portal para socios — gestioná tu membresía y horarios",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalTheme />
      {children}
    </>
  );
}
