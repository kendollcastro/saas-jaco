import PortalShell from "../portal-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
