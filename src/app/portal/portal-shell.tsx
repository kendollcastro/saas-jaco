"use client";

import { usePathname, useRouter } from "next/navigation";
import { getToken, clearToken, getStoredMember } from "@/lib/portal-client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/portal/dashboard", label: "Inicio", icon: "HomeIcon" },
  { href: "/portal/book", label: "Reservar", icon: "CalendarIcon" },
  { href: "/portal/qr", label: "Mi QR", icon: "QrIcon" },
  { href: "/portal/payments", label: "Pagos", icon: "CardIcon" },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/portal/login"); return; }
    const cached = getStoredMember();
    if (cached) setMember(cached);
  }, [router]);

  if (!mounted) return <div className="min-h-screen bg-background" />;

  function logout() {
    clearToken();
    router.push("/portal/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-[80px]">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-3 flex items-center justify-between">
        <Link href="/portal/dashboard" className="flex items-center gap-2.5 no-underline">
          {member && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-[14px] font-bold shadow-md shadow-primary/20">
              {member.name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <div className="text-[15px] font-extrabold text-foreground leading-tight">
              {member?.name?.split(" ")[0] || "Portal"}
            </div>
            <div className="text-[10px] text-muted-foreground">Portal de Socios</div>
          </div>
        </Link>
        <button onClick={logout} className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-destructive/10">
          Salir
        </button>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pb-2 pt-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all no-underline min-w-[64px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl" />
              )}
              <span className="relative z-10"><TabIcon name={tab.icon} active={isActive} /></span>
              <span className={cn("relative z-10 text-[10px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";
  const cls = "transition-transform group-hover:scale-110";
  switch (name) {
    case "HomeIcon":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cls}>
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "CalendarIcon":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cls}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "CardIcon":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cls}>
          <rect x="1" y="5" width="22" height="14" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><line x1="6" y1="16" x2="10" y2="16" />
        </svg>
      );
    case "QrIcon":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cls}>
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="4" height="4" /><line x1="5" y1="14" x2="5" y2="14.01" />
        </svg>
      );
    default:
      return null;
  }
}
