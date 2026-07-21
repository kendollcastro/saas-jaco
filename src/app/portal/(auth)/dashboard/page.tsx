"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken, getStoredMember } from "@/lib/portal-client";
import { fmtTime } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/portal/login"); return; }
    const cached = getStoredMember();
    if (cached) setMember(cached);
    fetch("/api/portal/me", { headers: { "x-portal-token": token } })
      .then((r) => r.json())
      .then((data) => { if (data.error) { clearToken(); router.replace("/portal/login"); } else setMember(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/portal/settings")
      .then((r) => r.json())
      .then((d) => { if (d.businessName) setSettings(d); })
      .catch(() => {});
  }, [router]);

  const daysLeft = useMemo(() =>
    member?.endDate ? Math.max(0, Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000)) : 0,
    [member]
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!member) return null;

  const statusColors: Record<string, string> = {
    active: "from-emerald-500 to-green-600",
    pending: "from-amber-400 to-orange-500",
    expired: "from-red-500 to-rose-600",
  };
  const statusLabels: Record<string, string> = {
    active: "Activo", pending: "Pendiente de pago", expired: "Vencido",
  };

  return (
    <div
      className="p-4 max-w-lg mx-auto space-y-3.5"
    >
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-foreground">
            Hola, {member.name?.split(" ")[0] || "socio"}
          </h1>
          <p className="text-[12px] text-muted-foreground">Bienvenido a tu portal</p>
        </div>
        {settings?.logoUrl && (
          <img src={settings.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-contain" />
        )}
      </div>

      {/* Premium Membership Status Card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${statusColors[member.status] || "from-gray-500 to-gray-600"} shadow-xl`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold">
              {statusLabels[member.status] || member.status}
            </span>
            {member.membership && (
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold capitalize">
                {member.membership}
              </span>
            )}
          </div>
          <div className="text-white">
            <p className="text-[12px] opacity-80">Teléfono</p>
            <p className="text-[16px] font-bold">{formatPhone(member.phone)}</p>
          </div>
          {member.email && (
            <div className="text-white">
              <p className="text-[12px] opacity-80">Email</p>
              <p className="text-[14px] font-bold">{member.email}</p>
            </div>
          )}
          {member.endDate && (
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-[12px] opacity-80">Vencimiento</p>
                <p className="text-[14px] font-bold">{new Date(member.endDate).toLocaleDateString("es-CR")}</p>
              </div>
              {daysLeft > 0 && (
                <div className={`text-right px-3 py-1.5 rounded-xl backdrop-blur-sm ${daysLeft <= 7 ? "bg-red-500/30" : "bg-white/20"}`}>
                  <p className="text-[20px] font-extrabold">{daysLeft}</p>
                  <p className="text-[10px] opacity-80">días</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SINPE Info (if available) */}
      {settings?.sinpePhone && (
        <div className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase">SINPE Móvil</p>
              <p className="text-[14px] font-bold text-foreground">{settings.sinpePhone}</p>
              {settings.sinpeName && <p className="text-[12px] text-muted-foreground">{settings.sinpeName}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/portal/book"
          className="group relative overflow-hidden backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-foreground">Reservar horario</p>
            <p className="text-[11px] text-muted-foreground">Elegí tu horario ideal</p>
          </div>
        </Link>
        <Link href="/portal/qr"
          className="group relative overflow-hidden backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="4" height="4" /><line x1="5" y1="14" x2="5" y2="14.01" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-foreground">Mi QR</p>
            <p className="text-[11px] text-muted-foreground">Mostralo al ingresar</p>
          </div>
        </Link>
        <Link href="/portal/payments"
          className="group relative overflow-hidden backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="5" width="22" height="14" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><line x1="6" y1="16" x2="10" y2="16" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-foreground">Pagos</p>
            <p className="text-[11px] text-muted-foreground">Subí tu comprobante</p>
          </div>
        </Link>
      </div>

      {/* Upcoming Bookings */}
      <BookingsSection />
    </div>
  );
}

function BookingsSection() {
  const [bookings, setBookings] = useState<any[]>([]);
  const token = getToken();

  useEffect(() => {
    fetch("/api/portal/bookings", { headers: { "x-portal-token": token || "" } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookings(data.slice(0, 5)); })
      .catch(() => {});
  }, [token]);

  const upcoming = useMemo(() =>
    bookings.filter((b) => b.status !== "cancelled" && new Date(b.date) >= new Date()).slice(0, 3),
    [bookings]
  );

  if (upcoming.length === 0) return null;

  return (
    <div
      className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg"
    >
      <h2 className="text-[14px] font-extrabold text-foreground mb-3">Próximas reservas</h2>
      <div className="space-y-2">
        {upcoming.map((b, i) => {
          const d = new Date(b.date);
          return (
            <div
              key={b.id}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/50"
            >
              <div className="text-center min-w-[44px]">
                <div className="text-[10px] font-bold text-primary uppercase">
                  {d.toLocaleDateString("es-CR", { weekday: "short" })}
                </div>
                <div className="text-[20px] font-extrabold text-foreground leading-none mt-0.5">{d.getDate()}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-foreground">
                  {fmtTime(b.slot?.startTime)} — {fmtTime(b.slot?.endTime)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {d.toLocaleDateString("es-CR", { month: "long", year: "numeric" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
