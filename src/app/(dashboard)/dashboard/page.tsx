"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dumbbell, Clock, Users, TrendingUp, Calendar, AlertTriangle,
  UserPlus, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { fmtStoredDate } from "@/lib/utils";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function fmt(d: string) {
  const dt = new Date(d);
  return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
}

interface Stats {
  businessType: string;
  todayBookings: number;
  monthBookings: number;
  monthRevenue: number;
  activeMembers: number;
  todayAttendance: number;
  totalMembers: number;
  newThisMonth: number;
  expiringCount: number;
  expiringMembers: { name: string; endDate: string; phone: string }[];
  expiredCount: number;
  todaySales: number;
  todayCheckins: { name: string; time: string }[];
}

function WidgetCard({ title, value, subtitle, icon: Icon, color, loading }: {
  title: string; value: string; subtitle?: string; icon: any; color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-col gap-2.5 md:gap-3 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between">
        <span className="text-[11px] md:text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}14`, color }}>
          <Icon className="size-[15px] md:size-[17px]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 md:h-9 bg-muted rounded-lg animate-pulse" />
      ) : (
        <div className="text-[24px] md:text-[30px] font-extrabold tracking-tight leading-none text-foreground">
          {value}
        </div>
      )}
      {subtitle && <div className="text-[11px] text-muted-foreground leading-tight">{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([s, settingsData]) => {
        setStats(s);
        const mods: string[] = [];
        if (settingsData.modules) {
          for (const m of settingsData.modules) if (m.active) mods.push(m.key);
        }
        if (mods.length === 0) mods.push("bookings", "staff");
        setModules(mods);
      })
      .catch(() => toast.error("Error al cargar dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const businessType = stats?.businessType || "tourism";
  const isGym = businessType === "gym";
  const hasMembers = modules.includes("memberships") || (stats?.totalMembers || 0) > 0;
  const hasBookings = modules.includes("bookings");

  const topWidgets = useMemo(() => {
    if (!stats) return [];
    if (isGym) {
      return [
        { key: "active", title: "Socios activos", value: String(stats.activeMembers), subtitle: `${stats.totalMembers} total registrados`, icon: Dumbbell, color: "#16a34a" },
        { key: "attendance", title: "Asistencias hoy", value: String(stats.todayAttendance), subtitle: stats.todayCheckins.length > 0 ? `Último: ${stats.todayCheckins[0]?.name || ""}` : "Sin check-ins aún", icon: Clock, color: "#2563eb" },
        { key: "expiring", title: "Próximos a vencer", value: String(stats.expiringCount), subtitle: stats.expiringMembers.length > 0 ? `${stats.expiringMembers[0].name} - ${fmt(stats.expiringMembers[0].endDate)}` : "", icon: AlertTriangle, color: "#f59e0b" },
        { key: "new", title: "Nuevos este mes", value: String(stats.newThisMonth), subtitle: "Socios registrados", icon: UserPlus, color: "#8b5cf6" },
      ];
    }
    return [
      { key: "today", title: "Reservas hoy", value: String(stats.todayBookings), subtitle: `${stats.monthBookings} este mes`, icon: Calendar, color: "#1e40af" },
      { key: "revenue", title: "Ingresos del mes", value: `₡${stats.monthRevenue.toLocaleString("de-DE")}`, subtitle: "De reservas", icon: TrendingUp, color: "#059669" },
      { key: "members", title: "Socios activos", value: String(stats.activeMembers), subtitle: `${stats.totalMembers} total`, icon: Dumbbell, color: "#16a34a" },
      { key: "new", title: "Nuevos clientes", value: String(stats.newThisMonth), subtitle: "Este mes", icon: UserPlus, color: "#8b5cf6" },
    ];
  }, [stats, isGym]);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {topWidgets.map(({ key, ...w }) => (
          <WidgetCard key={key} {...w} loading={loading} />
        ))}

        {/* Month revenue — always shown */}
        <div className={`bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-col gap-2.5 md:gap-3 sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] md:text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
              {isGym ? "Ingresos del mes" : "Ventas del mes"}
            </span>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "#05966914", color: "#059669" }}>
              <TrendingUp className="size-[15px] md:size-[17px]" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 md:h-9 bg-muted rounded-lg animate-pulse" />
          ) : (
            <div className="text-[24px] md:text-[30px] font-extrabold tracking-tight leading-none text-foreground">
              ₡{((stats?.monthRevenue || 0) + (stats?.todaySales || 0)).toLocaleString("de-DE")}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{stats?.monthRevenue ? `₡${stats.monthRevenue.toLocaleString("de-DE")} de reservas` : ""}</span>
            {(stats?.todaySales || 0) > 0 && <span>• ₡{(stats?.todaySales || 0).toLocaleString("de-DE")} hoy en caja</span>}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Check-ins list */}
        {(isGym || hasMembers) && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-border">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-[9px] bg-blue-600/10 flex items-center justify-center">
                <Clock className="size-[13px] md:size-[15px] text-blue-600" />
              </div>
              <div>
                <div className="text-[13px] md:text-[14px] font-extrabold text-card-foreground">
                  {isGym ? "Check-ins de hoy" : "Asistencias de hoy"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {stats?.todayCheckins?.length || 0} registros
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-4 md:p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-[48px] md:h-[52px] bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : !stats?.todayCheckins?.length ? (
              <div className="text-center py-10 md:py-12 text-sm font-semibold text-muted-foreground">
                <Clock className="size-7 md:size-8 mx-auto mb-2 opacity-40" />
                Sin check-ins hoy
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.todayCheckins.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-[9px] bg-blue-600/10 flex items-center justify-center font-bold text-[11px] md:text-xs text-blue-600 shrink-0">
                      {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] md:text-[13px] font-bold text-card-foreground truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">Ingresó a las {c.time}</div>
                    </div>
                    <Zap className="size-[13px] md:size-[14px] text-blue-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expiring members */}
        {(isGym || hasMembers) && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-border">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-[9px] bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="size-[13px] md:size-[15px] text-amber-600" />
              </div>
              <div>
                <div className="text-[13px] md:text-[14px] font-extrabold text-card-foreground">Próximos a vencer</div>
                <div className="text-[11px] text-muted-foreground">
                  {stats?.expiringCount || 0} socio{(stats?.expiringCount || 0) !== 1 ? "s" : ""} en 7 días
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-4 md:p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-[48px] md:h-[52px] bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : !stats?.expiringMembers?.length ? (
              <div className="text-center py-10 md:py-12 text-sm font-semibold text-muted-foreground">
                <Users className="size-7 md:size-8 mx-auto mb-2 opacity-40" />
                Sin socios próximos a vencer
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.expiringMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-[9px] bg-amber-500/10 flex items-center justify-center font-bold text-[11px] md:text-xs text-amber-600 shrink-0">
                      {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] md:text-[13px] font-bold text-card-foreground truncate">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">Vence {fmt(m.endDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Non-gym: Bookings list */}
        {!isGym && hasBookings && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-border">
              <Calendar className="size-[13px] md:size-[15px] text-primary" />
              <div>
                <div className="text-[13px] md:text-[14px] font-extrabold text-card-foreground">Reservas de hoy</div>
                <div className="text-[11px] text-muted-foreground">{stats?.todayBookings || 0} reservas</div>
              </div>
            </div>
            <div className="text-center py-10 md:py-12 text-sm font-semibold text-muted-foreground">
              <Calendar className="size-7 md:size-8 mx-auto mb-2 opacity-40" />
              {stats?.todayBookings === 0 ? "Sin reservas hoy" : "Revisá la sección Reservas"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
