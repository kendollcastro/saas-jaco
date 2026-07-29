"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Shield, Building2, LogOut, LayoutDashboard, Menu, X, MessageSquare, ScrollText } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    fetch("/api/me")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        if (data.role !== "super_admin") {
          router.replace("/admin/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [router, pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-6 pb-7">
        <div className="w-9 h-9 rounded-[10px] bg-[#1e40af] flex items-center justify-center flex-shrink-0">
          <Shield className="size-[18px] text-white" />
        </div>
        <div>
          <div className="text-base font-extrabold text-white tracking-tight leading-none">Admin</div>
          <div className="text-[10.5px] font-semibold text-white/40 uppercase tracking-wider mt-[2px]">Ola Saas</div>
        </div>
      </div>

      <div className="text-[10.5px] font-bold text-white/30 uppercase tracking-widest px-[18px] pb-[10px]">Admin</div>

      <nav className="flex flex-col px-3 gap-0.5">
        <SidebarLink href="/admin" icon={LayoutDashboard} label="Dashboard" pathname={pathname} />
        <SidebarLink href="/admin/tenants" icon={Building2} label="Tenants" pathname={pathname} />
        <SidebarLink href="/admin/support" icon={MessageSquare} label="Soporte" pathname={pathname} />
        <SidebarLink href="/admin/audit" icon={ScrollText} label="Auditoría" pathname={pathname} />
      </nav>

      <div className="mt-auto mx-3 mb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">AD</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">Admin</div>
            <div className="text-[11px] text-white/45">Super Admin</div>
          </div>
          <button
            onClick={async () => {
              const supabase = (await import("@/lib/supabase/client")).createClient();
              await supabase.auth.signOut();
              router.push("/admin/login");
            }}
            className="text-white/50 hover:text-white/80 transition flex-shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0f172a] flex-col flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,.5)] z-50 md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[250px] bg-[#0f172a] z-[60] flex flex-col transition-transform duration-[280ms] md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-3 px-4 md:px-7 py-3 md:py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-[38px] h-[38px] rounded-[10px] border border-border bg-background text-muted-foreground flex items-center justify-center flex-shrink-0"
            >
              <Menu className="size-[18px]" />
            </button>
            <h1 className="text-[17px] md:text-xl font-extrabold tracking-tight text-foreground">{getPageTitle(pathname)}</h1>
          </div>
          <Link href="/dashboard" className="text-[12px] font-bold text-primary hover:underline hidden sm:inline">
            Ir al Dashboard del negocio →
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5 md:py-7">{children}</div>
      </main>

      <Toaster />
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, pathname }: { href: string; icon: any; label: string; pathname: string }) {
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition ${
        isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="size-[18px] flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/tenants")) {
    if (pathname === "/admin/tenants") return "Tenants";
    return "Detalle del Tenant";
  }
  if (pathname.startsWith("/admin/support")) return "Soporte";
  if (pathname.startsWith("/admin/audit")) return "Auditoría";
  return "Admin";
}
