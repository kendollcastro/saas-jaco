"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, DollarSign, Dumbbell, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Pendiente", bg: "#fef3c7", color: "#92400e" },
  confirmed: { label: "Confirmado", bg: "#dcfce7", color: "#15803d" },
  cancelled: { label: "Cancelado", bg: "#fee2e2", color: "#b91c1c" },
  completed: { label: "Completado", bg: "#dbeafe", color: "#1d4ed8" },
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayBookings: 0, monthBookings: 0, monthRevenue: 0, activeMembers: 0, todayAttendance: 0, totalMembers: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/sales").then((r) => r.json()).catch(() => []),
    ])
      .then(([statsData, bookingsData, settingsData, salesData]) => {
        setStats(statsData);
        setBookings(Array.isArray(bookingsData) ? bookingsData.slice(0, 5) : []);
        setSales(Array.isArray(salesData) ? salesData.slice(0, 5) : []);

        const mods: string[] = [];
        if (settingsData.modules) {
          for (const m of settingsData.modules) {
            if (m.active) mods.push(m.key);
          }
        }
        if (mods.length === 0) mods.push("bookings", "staff");
        setModules(mods);
      })
      .catch(() => toast.error("Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const hasBookings = modules.includes("bookings");
  const hasMembers = modules.includes("members") || stats.totalMembers > 0;
  const hasInventory = modules.includes("inventory") || stats.totalMembers > 0;

  const widgets: { key: string; title: string; value: string; icon: any; color: string; size: "md" | "lg" }[] = [];

  if (hasMembers || stats.totalMembers > 0) {
    widgets.push({ key: "members", title: "Socios activos", value: stats.activeMembers.toString(), icon: Dumbbell, color: "#16a34a", size: "md" });
    widgets.push({ key: "attendance", title: "Asistencias hoy", value: stats.todayAttendance.toString(), icon: Clock, color: "#2563eb", size: "md" });
  }
  if (hasBookings || stats.todayBookings > 0) {
    widgets.push({ key: "today", title: "Reservas hoy", value: stats.todayBookings.toString(), icon: Calendar, color: "#1e40af", size: "md" });
  }
  if (hasInventory) {
    const todaySales = sales.filter((s: any) => {
      const sd = new Date(s.createdAt);
      const now = new Date();
      return sd.toDateString() === now.toDateString();
    });
    const total = todaySales.reduce((sum: number, s: any) => sum + s.total, 0);
    widgets.push({ key: "revenue", title: "Ventas hoy", value: `₡${total.toLocaleString("de-DE")}`, icon: ShoppingCart, color: "#1e40af", size: "md" });
  }
  widgets.push({ key: "month-revenue", title: "Ingresos del mes", value: `₡${stats.monthRevenue.toLocaleString("de-DE")}`, icon: TrendingUp, color: "#1e40af", size: "lg" });

  return (
    <div className="animate-[jacoFade_0.25s_ease] space-y-6">
      {/* Bento Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <motion.div
            key={w.key}
            variants={item}
            whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 ${w.size === "lg" ? "sm:col-span-2" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{w.title}</span>
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: `${w.color}14`, color: w.color }}
              >
                <w.icon className="size-[17px]" />
              </div>
            </div>
            {loading ? (
              <div className="h-9 bg-muted rounded-lg animate-pulse" />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-[32px] font-extrabold tracking-tight leading-none text-foreground"
              >
                {w.value}
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: w.color }} />
              <span>
                {w.key === "members" ? "Membresías activas" :
                 w.key === "attendance" ? "Check-ins de hoy" :
                 w.key === "today" ? "Reservas pendientes" :
                 w.key === "revenue" ? "Ventas del día" : "Este mes"}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[9px] bg-primary/10 flex items-center justify-center">
                <Calendar className="size-[15px] text-primary" />
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-card-foreground">Próximas reservas</div>
                <div className="text-[11px] text-muted-foreground">Agenda de los próximos días</div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-semibold">Sin reservas próximas</div>
          ) : (
            <div className="divide-y divide-border">
              {bookings.map((b: any, i: number) => {
                const st = statusConfig[b.status] || statusConfig.pending;
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ backgroundColor: "var(--accent)" }}
                    className="flex items-center gap-3 px-5 py-3 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs shrink-0 bg-primary/10 text-primary">
                      {(b.customerName || "").split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-card-foreground truncate">{b.customerName}</div>
                      <div className="text-[11px] text-muted-foreground">{b.serviceName} • {formatDate(b.date)}</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[9px] bg-green-600/10 flex items-center justify-center">
                <ShoppingCart className="size-[15px] text-green-600" />
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-card-foreground">Últimas ventas</div>
                <div className="text-[11px] text-muted-foreground">Registro de caja</div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-semibold">Sin ventas recientes</div>
          ) : (
            <div className="divide-y divide-border">
              {sales.map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ backgroundColor: "var(--accent)" }}
                  className="flex items-center justify-between px-5 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs shrink-0 bg-green-600/10 text-green-600">
                      <ShoppingCart className="size-[14px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-card-foreground truncate">
                        {s.items?.length || 0} producto{(s.items?.length || 0) !== 1 ? "s" : ""}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.method} • {formatDate(s.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-[14px] font-extrabold text-card-foreground shrink-0">
                    ₡{(s.total || 0).toLocaleString("de-DE")}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
