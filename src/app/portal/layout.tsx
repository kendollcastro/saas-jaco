import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Socios",
  description: "Portal para socios — gestioná tu membresía y horarios",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
