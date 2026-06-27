"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Tent,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reservas", href: "/dashboard/bookings", icon: Calendar },
  { label: "Servicios", href: "/dashboard/services", icon: Tent },
  { label: "Staff", href: "/dashboard/staff", icon: Users },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setSidebarCollapsed(w >= 768 && w < 1100);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track scroll for subtle shadow on topbar
  useEffect(() => {
    const el = document.querySelector("[data-main]");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Page title from path
  const currentPage = navItems.find((i) => pathname.startsWith(i.href))?.label ?? "Dashboard";

  // Format today's date
  const today = new Date();
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center pt-5 pb-7" : "gap-3 px-5 pt-6 pb-7"}`}>
        <div className="w-9 h-9 rounded-[10px] bg-[#1e40af] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="9" r="3.4" />
            <path d="M3 19c2.5-3 6-4.5 9-4.5s6.5 1.5 9 4.5" />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-base font-extrabold text-white tracking-tight leading-none">
              Jacó<span className="text-[#93b4f7]"> SaaS</span>
            </div>
            <div className="text-[10.5px] font-semibold text-white/40 uppercase tracking-wider mt-[2px]">
              Reservas
            </div>
          </div>
        )}
      </div>

      {/* Menu heading */}
      {!sidebarCollapsed && (
        <div className="text-[10.5px] font-bold text-white/30 uppercase tracking-widest px-[18px] pb-[10px]">
          Menú
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col px-3 gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setDrawerOpen(false)}
              className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-[10px] text-sm font-semibold transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="size-[18px] flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      <div className={`mt-auto ${sidebarCollapsed ? "mx-2 mb-4" : "mx-3 mb-4"}`}>
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-3 rounded-xl bg-white/5`}>
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            AD
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white truncate">Admin</div>
                <div className="text-[11px] text-white/45">Administrador</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/50 hover:text-white/80 transition flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f4f6f9]">
      {/* Desktop/Tablet sidebar */}
      <aside
        className={`hidden md:flex bg-[#101a36] border-r border-white/10 flex-col flex-shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isMobile && drawerOpen && (
        <div
          className="fixed inset-0 bg-[rgba(15,23,42,.5)] z-50 animate-[jacoFade_0.2s_ease]"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <aside
          className={`fixed top-0 left-0 h-full w-[250px] bg-[#101a36] z-[60] flex flex-col p-[22px_16px] transition-transform duration-[280ms] ease-[cubic-bezier(.16,.84,.44,1)] ${
            drawerOpen ? "translate-x-0 shadow-[6px_0_36px_rgba(0,0,0,.34)]" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className={`flex items-center justify-between gap-3.5 px-4 md:px-7 py-3 md:py-4 border-b border-[#e8ecf2] bg-white flex-shrink-0 transition-shadow ${
            scrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger on mobile */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-[38px] h-[38px] rounded-[10px] border border-[#e8ecf2] bg-white text-[#334155] flex items-center justify-center flex-shrink-0"
              >
                <Menu className="size-[18px]" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-[17px] md:text-xl font-extrabold tracking-tight text-[#0f172a] truncate">
                {currentPage}
              </h1>
              <p className="text-[13px] text-[#64748b] mt-0.5 hidden md:block">
                {pathname === "/dashboard"
                  ? "Resumen de actividad de hoy"
                  : pathname.startsWith("/dashboard/bookings")
                  ? "Gestiona todas las reservas"
                  : pathname.startsWith("/dashboard/services")
                  ? "Catálogo de experiencias"
                  : pathname.startsWith("/dashboard/staff")
                  ? "Equipo e instructores"
                  : pathname.startsWith("/dashboard/settings")
                  ? "Ajustes del negocio"
                  : ""}
              </p>
            </div>
          </div>

          {/* Date chip */}
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#475569] bg-[#f1f5f9] rounded-[10px] px-3.5 py-2 flex-shrink-0">
            <Calendar className="size-[15px]" />
            <span className="hidden xs:inline">{dateStr}</span>
          </div>
        </header>

        {/* Content */}
        <div
          data-main
          className="flex-1 overflow-y-auto px-4 md:px-7 py-5 md:py-7"
        >
          {children}
        </div>
        <Toaster />
      </main>
    </div>
  );
}
