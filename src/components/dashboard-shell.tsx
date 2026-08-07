"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "next-themes";
import ThemeApplier, { applyDashboardTheme } from "@/components/theme-applier";

const OnboardingWizard = dynamic(
  () => import("@/components/onboarding-wizard"),
  { ssr: false }
);
import {
  LayoutDashboard,
  Calendar,
  Users,
  Tent,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  Dumbbell,
  Package,
  ShoppingCart,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  MessageSquare,
  BarChart3,
  Scan,
} from "lucide-react";

export interface DashboardSettings {
  businessName: string;
  logoUrl: string;
  bookingNavLabel: string | null;
  themePreset: string;
  colorPrimary: string;
  activeModuleKeys: string[];
  maintenance: { enabled: boolean; message: string } | null;
  onboarding: { needsOnboarding: boolean; progress: any } | null;
}

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: null },
  { label: "Check-in", href: "/dashboard/checkin", icon: Scan, module: "memberships" },
  { label: "Reservas", href: "/dashboard/bookings", icon: Calendar, module: "bookings" },
  { label: "Servicios", href: "/dashboard/services", icon: Tent, module: "bookings" },
  { label: "Staff", href: "/dashboard/staff", icon: Users, module: "staff" },
  { label: "Socios", href: "/dashboard/members", icon: Dumbbell, module: "memberships" },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: Bell, module: "memberships" },
  { label: "Planes", href: "/dashboard/members/plans", icon: Dumbbell, module: "memberships" },
  { label: "Horario", href: "/dashboard/schedule", icon: Clock, module: "bookings" },
  { label: "Productos", href: "/dashboard/products", icon: Package, module: "inventory" },
  { label: "Caja", href: "/dashboard/pos", icon: ShoppingCart, module: "inventory" },
  { label: "Facturación", href: "/dashboard/invoices", icon: Receipt, module: "invoicing" },
  { label: "Soporte", href: "/dashboard/support", icon: MessageSquare, module: null },
  { label: "Reportes", href: "/dashboard/reports", icon: BarChart3, module: null },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings, module: null },
];

const themePresets: Record<string, string> = {
  default: "#1e40af",
  ocean: "#0d9488",
  forest: "#16a34a",
  sunset: "#ea580c",
  midnight: "#7c3aed",
};

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16) };
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

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

export default function DashboardShell({
  initial,
  children,
}: {
  initial: DashboardSettings;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [activeModules, setActiveModules] = useState<string[]>(initial.activeModuleKeys);
  const [bookingNavLabel, setBookingNavLabel] = useState(initial.bookingNavLabel);
  const [maintenance] = useState<{ enabled: boolean; message: string } | null>(initial.maintenance);
  const [onboarding, setOnboarding] = useState<{ needsOnboarding: boolean; progress: any } | null>(initial.onboarding);
  const lastLogoRef = useRef(initial.logoUrl);

  const primary = themePresets[initial.themePreset] || initial.colorPrimary || "#1e40af";
  const themeVars = useMemo(
    () =>
      ({
        "--color-primary": primary,
        "--color-ring": primary,
        "--color-chart-1": primary,
        "--primary": primary,
        "--ring": primary,
        "--chart-1": primary,
        "--sidebar-primary": primary,
        "--sidebar-primary-foreground": "#ffffff",
        "--sidebar": darken(primary, 0.85),
        "--sidebar-foreground": "#ffffff",
        "--sidebar-accent": "rgba(255, 255, 255, 0.08)",
        "--sidebar-border": "rgba(255, 255, 255, 0.06)",
      }) as React.CSSProperties,
    [primary]
  );

  function loadSidebarInfo() {
    fetch("/api/notifications/count")
      .then((r) => r.json())
      .then((d) => setNotifCount(d.count ?? 0))
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setBusinessName(d.businessName || "");
        setLogoUrl(d.logoUrl || "");
        setBookingNavLabel(d.bookingNavLabel || "");
        if (d.modules) {
          setActiveModules(d.modules.filter((m: any) => m.active).map((m: any) => m.key));
        }
        applyDashboardTheme(d.themePreset || "default", d.colorPrimary, d.logoUrl);
        if (d.businessName) document.title = d.businessName;
        if (d.logoUrl && d.logoUrl !== lastLogoRef.current) {
          lastLogoRef.current = d.logoUrl;
          refreshFavicon();
        }
      })
      .catch(() => {});
  }

  function refreshFavicon() {
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => {
      const href = (el as HTMLLinkElement).getAttribute("href") || "";
      if (href.startsWith("/api/tenant-icon")) {
        (el as HTMLLinkElement).setAttribute("href", `/api/tenant-icon?v=${Date.now()}`);
      }
    });
  }

  // Fetch notification badge count and business info
  useEffect(() => {
    loadSidebarInfo();
    const handler = () => loadSidebarInfo();
    window.addEventListener("focus", handler);
    window.addEventListener("settings-saved", handler);
    window.addEventListener("payment-confirmed", handler);
    const interval = setInterval(loadSidebarInfo, 60_000);
    return () => { window.removeEventListener("focus", handler); window.removeEventListener("settings-saved", handler); window.removeEventListener("payment-confirmed", handler); clearInterval(interval); };
  }, []);

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

  function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-[34px] h-[34px]" />;
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] transition-transform hover:scale-105 active:scale-95"
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      >
        {theme === "dark" ? (
              <Sun className="size-[16px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition" />
        ) : (
              <Moon className="size-[16px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition" />
        )}
      </button>
    );
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = useMemo(() => allNavItems
    .filter((i) => !i.module || activeModules.includes(i.module))
    .map((i) => ({
      ...i,
      label: i.label === "Reservas" && bookingNavLabel ? bookingNavLabel : i.label,
    })),
  [activeModules, bookingNavLabel]);

  // Page title from path
  const currentPage = navItems.find((i) => pathname.startsWith(i.href))?.label ?? "Dashboard";

  // Format today's date
  const today = new Date();
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`flex items-center animate-[jacoUp_0.4s_ease] ${sidebarCollapsed ? "justify-center pt-5 pb-7" : "gap-3 px-5 pt-6 pb-7"}`}
        id="sidebar-logo-text"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-[10px] object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-9 h-9 rounded-[10px] bg-sidebar-primary flex items-center justify-center flex-shrink-0 transition-transform hover:rotate-[10deg]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="9" r="3.4" />
              <path d="M3 19c2.5-3 6-4.5 9-4.5s6.5 1.5 9 4.5" />
            </svg>
          </div>
        )}
        {!sidebarCollapsed && (
          <div>
            <div className="text-base font-extrabold text-sidebar-foreground tracking-tight leading-none">
              {businessName || "Ola Saas"}
            </div>
            <div className="text-[10.5px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-[2px]">
              {businessName ? "Panel de control" : "Reservas"}
            </div>
          </div>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className="text-[10.5px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-[18px] pb-[10px]">Menú</div>
      )}

      <nav className="flex flex-col px-3 gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div
              key={item.href}
              className="transition-transform hover:translate-x-[3px] active:scale-[0.97]"
            >
              <Link
                href={item.href}
                onClick={() => isMobile && setDrawerOpen(false)}
                className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-[10px] text-sm font-semibold transition ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="relative">
                  <item.icon className="size-[18px] flex-shrink-0" />
                  {item.label === "Notificaciones" && notifCount > 0 && (
                    <span className="absolute -top-[6px] -right-[6px] min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full leading-none px-[4px]">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User chip */}
      <div className={`mt-auto ${sidebarCollapsed ? "mx-2 mb-4" : "mx-3 mb-4"}`}>
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-3 rounded-xl bg-sidebar-accent`}>
          <div className="w-[34px] h-[34px] rounded-[9px] bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
            AD
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-sidebar-foreground truncate">Admin</div>
                <div className="text-[11px] text-sidebar-foreground/45">Administrador</div>
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
    <ThemeApplier themePreset={initial.themePreset} colorPrimary={initial.colorPrimary} logoUrl={initial.logoUrl} />
    <div id="theme-root" style={themeVars}>
    {onboarding?.needsOnboarding && (
      <OnboardingWizard
        progress={onboarding.progress}
        onComplete={() => setOnboarding(null)}
      />
    )}
    {maintenance?.enabled ? (
      <div className="flex h-screen bg-background items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <Wrench className="size-12 mx-auto text-amber-500" />
          <h1 className="text-xl font-extrabold text-foreground">Modo Mantenimiento</h1>
          <p className="text-[14px] text-muted-foreground leading-relaxed">{maintenance.message || "Estamos realizando mejoras. Volvemos pronto."}</p>
        </div>
      </div>
    ) : (
    <div className="flex h-screen bg-background">
      {/* Desktop/Tablet sidebar */}
      <aside
        className={`hidden md:flex bg-sidebar border-r border-sidebar-border flex-col flex-shrink-0 transition-all duration-200 ${
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
          className={`fixed top-0 left-0 h-full w-[250px] bg-sidebar z-[60] flex flex-col p-[22px_16px] transition-transform duration-[280ms] ease-[cubic-bezier(.16,.84,.44,1)] ${
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
          className={`flex items-center justify-between gap-3.5 px-4 md:px-7 py-3 md:py-4 border-b border-border bg-background flex-shrink-0 transition-shadow ${
            scrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger on mobile */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-[44px] h-[44px] rounded-[12px] border border-border bg-background text-muted-foreground flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              >
                <Menu className="size-[18px]" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-[17px] md:text-xl font-extrabold tracking-tight text-foreground truncate">
                {currentPage}
              </h1>
              <p className="text-[12px] md:text-[13px] text-muted-foreground mt-0.5">
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
                  : pathname.startsWith("/dashboard/notifications")
                  ? "Notificaciones y recordatorios"
                  : pathname.startsWith("/dashboard/schedule")
                  ? "Gestión de horarios semanales"
                  : pathname.startsWith("/dashboard/support")
                  ? "Soporte y ayuda"
                  : pathname.startsWith("/dashboard/reports")
                  ? "Reportes y estadísticas"
                  : pathname.startsWith("/dashboard/members/plans")
                  ? "Personalizá los planes de membresía"
                  : ""}
              </p>
            </div>
          </div>

          {/* Date chip */}
          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground bg-muted rounded-[10px] px-3.5 py-2 flex-shrink-0">
            <Calendar className="size-[14px] md:size-[15px]" />
            <span className="text-[12px] md:text-[13px]">{dateStr}</span>
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
    )}
    </div>
    </ThemeProvider>
  );
}
