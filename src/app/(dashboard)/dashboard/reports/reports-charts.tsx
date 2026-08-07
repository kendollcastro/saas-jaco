"use client";

import { BarChart3, TrendingUp, Users, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const MONTHS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr", "05": "May", "06": "Jun",
  "07": "Jul", "08": "Ago", "09": "Set", "10": "Oct", "11": "Nov", "12": "Dic",
};

export default function ReportsCharts({ data }: { data: any }) {
  const revenueData = data?.monthlyRevenue?.map((m: any) => ({
    month: MONTHS[m.month.split("-")[1]] || m.month,
    ingresos: Math.round(m.revenue),
    reservas: m.bookings,
  })) || [];

  const statusLabels: Record<string, string> = { active: "Activos", expired: "Vencidos", pending: "Pendientes", cancelled: "Cancelados" };
  const pieData = data?.membersByStatus?.map((m: any) => ({
    name: statusLabels[m.status] || m.status,
    value: m.count,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-[16px] text-primary" />
          <h2 className="text-[14.5px] font-extrabold text-foreground">Ingresos mensuales</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              formatter={(v: any) => [`$${Number(v).toLocaleString("es-CR")}`, "Ingresos"]}
            />
            <Bar dataKey="ingresos" fill="url(#revGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bookings Chart */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-[16px] text-primary" />
          <h2 className="text-[14.5px] font-extrabold text-foreground">Reservas por mes</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              formatter={(v: any) => [Number(v), "Reservas"]}
            />
            <Bar dataKey="reservas" fill="url(#bookGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Members Pie */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="size-[16px] text-primary" />
          <h2 className="text-[14.5px] font-extrabold text-foreground">Socios por estado</h2>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {pieData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              formatter={(v: any, name: any) => [Number(v), name]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => <span className="text-[12px] text-foreground font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="size-[16px] text-primary" />
          <h2 className="text-[14.5px] font-extrabold text-foreground">Productos más vendidos</h2>
        </div>
        {data?.topProducts?.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Sin ventas aún</p>
        ) : (
          <div className="space-y-1">
            {data?.topProducts?.slice(0, 6).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                  <span className="text-[13px] font-semibold text-foreground truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-muted-foreground">{p.quantity} vendidos</span>
                  <span className="text-[12px] font-bold text-foreground">${p.total.toLocaleString("es-CR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
