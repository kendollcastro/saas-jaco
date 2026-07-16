"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  Users,
  DollarSign,
  Dumbbell,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Wrench,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(setStats)
      .catch(() => {
        setStatsError(true);
        toast.error("Error al cargar estadísticas");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-[jacoFade_0.25s_ease]">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-muted" />
              </div>
              <div className="h-[28px] w-24 rounded-md bg-muted mb-2" />
              <div className="h-[14px] w-32 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allZeros =
    stats &&
    !statsError &&
    (stats?.activeTenants ?? 0) === 0 &&
    (stats?.totalUsers ?? 0) === 0 &&
    (stats?.totalMembers ?? 0) === 0 &&
    (stats?.totalRevenue ?? 0) === 0;

  const cards = [
    {
      label: "Tenants activos",
      value: `${stats?.activeTenants ?? 0}`,
      sub: stats?.totalTenants != null ? `/ ${stats.totalTenants}` : null,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Usuarios",
      value: `${stats?.totalUsers ?? 0}`,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Socios",
      value: `${stats?.totalMembers ?? 0}`,
      icon: Dumbbell,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Ingresos totales",
      value: `$${((stats?.totalRevenue ?? 0) / 100).toLocaleString("es-CR", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Ingresos mensuales (MRR)",
      value: "$0",
      icon: DollarSign,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      tooltip: "Próximamente",
    },
  ];

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="text-[12px] font-semibold text-muted-foreground mb-4 tracking-wide">
        Dashboard
      </div>

      {allZeros && (
        <div className="mb-4 text-[11px] font-semibold text-muted-foreground/50 tracking-wide">
          Sin datos aún — los valores aparecerán cuando haya actividad
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((c) => {
          const hasError = statsError && c.label !== "Ingresos mensuales (MRR)";
          return (
            <div
              key={c.label}
              className={`bg-card rounded-2xl p-5 border shadow-sm relative ${
                hasError
                  ? "border-red-500/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-[10px] ${c.bg} flex items-center justify-center`}
                >
                  <c.icon
                    className={`size-[18px] ${hasError ? "text-red-400" : c.color}`}
                  />
                </div>
                {c.tooltip && (
                  <span title={c.tooltip}>
                    <HelpCircle className="size-3.5 text-muted-foreground/40 ml-auto" />
                  </span>
                )}
                {hasError && (
                  <span title="Error al cargar datos">
                    <AlertCircle className="size-3.5 text-red-400 ml-auto" />
                  </span>
                )}
              </div>
              <div
                className={`text-[22px] font-extrabold tracking-tight ${
                  hasError ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {hasError ? "--" : c.value}
                {!hasError && c.sub && (
                  <span className="text-[15px] font-bold text-muted-foreground/50">
                    {" "}
                    {c.sub}
                  </span>
                )}
              </div>
              <div className="text-[12.5px] font-semibold text-muted-foreground mt-0.5">
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[14.5px] font-extrabold text-foreground">Tenants</h2>
            <Link
              href="/admin/tenants"
              className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="p-1">
            <div className="flex items-center justify-between px-4 py-2.5 text-[12px] font-bold text-muted-foreground">
              <span>Nombre</span>
              <div className="flex gap-4">
                <span className="w-12 text-right">Users</span>
                <span className="w-12 text-right">Socios</span>
                <span className="w-12 text-right">Plan</span>
              </div>
            </div>
            <TenantRow />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <DollarSign className="size-[16px] text-primary" />
            <h2 className="text-[14.5px] font-extrabold text-foreground">
              Resumen de ingresos
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] font-semibold text-muted-foreground">Ingresos este mes</span>
              <span className="text-[15px] font-extrabold text-foreground">$0.00</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/40">
              <span className="text-[13px] font-semibold text-muted-foreground">Ingresos totales (plataforma)</span>
              <span className="text-[15px] font-extrabold text-foreground">$0.00</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/40">
              <span className="text-[13px] font-semibold text-muted-foreground">Tenentes activos</span>
              <span className="text-[15px] font-extrabold text-foreground">{stats?.activeTenants ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/40">
              <span className="text-[13px] font-semibold text-muted-foreground">Total usuarios</span>
              <span className="text-[15px] font-extrabold text-foreground">{stats?.totalUsers ?? 0}</span>
            </div>
            <p className="text-[11px] text-muted-foreground/50 pt-2 border-t border-border/40">
              La monetización SaaS estará disponible próximamente.
            </p>
          </div>
        </div>
      </div>

      <MaintenanceSection />
    </div>
  );
}

function MaintenanceSection() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maintenance")
      .then((r) => r.json())
      .then((d) => { setEnabled(d.enabled); setMessage(d.message || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled, message }),
      });
      if (res.ok) { setEnabled(!enabled); toast.success(enabled ? "Modo mantenimiento desactivado" : "Modo mantenimiento activado"); }
      else toast.error("Error");
    } catch { toast.error("Error de red"); }
    finally { setSaving(false); }
  }

  async function saveMessage() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, message }),
      });
      if (res.ok) toast.success("Mensaje guardado");
      else toast.error("Error");
    } catch { toast.error("Error de red"); }
    finally { setSaving(false); }
  }

  if (loading) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm mt-5">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <Wrench className={`size-[16px] ${enabled ? "text-amber-500" : "text-primary"}`} />
        <h2 className="text-[14.5px] font-extrabold text-foreground">Modo Mantenimiento</h2>
        {enabled && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">ACTIVO</span>}
      </div>
      <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mensaje para los tenants</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Estamos realizando mejoras. Volvemos pronto."
            className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={saveMessage} disabled={saving} className="px-4 py-2.5 rounded-[10px] border border-border text-[12px] font-bold text-muted-foreground hover:bg-muted transition disabled:opacity-50">{saving ? "..." : "Guardar"}</button>
          <button onClick={toggle} disabled={saving} className={`px-4 py-2.5 rounded-[10px] text-[12px] font-bold text-white transition disabled:opacity-50 ${enabled ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}>
            {saving ? "..." : enabled ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TenantRow() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(setTenants)
      .catch(() => {
        setError(true);
        toast.error("Error al cargar tenants");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-8">
        Cargando...
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-muted-foreground justify-center">
        <AlertCircle className="size-4 text-red-400" />
        Error al cargar tenants
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-8">
        Sin tenants registrados
      </p>
    );
  }

  return tenants.slice(0, 5).map((t) => (
    <Link
      key={t.id}
      href={`/admin/tenants/${t.id}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition rounded-lg mx-1"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            t.active ? "bg-emerald-500" : "bg-red-400"
          }`}
        />
        <span className="text-[13px] font-bold text-foreground truncate">
          {t.name}
        </span>
      </div>
      <div className="flex gap-4 text-[13px] font-semibold text-muted-foreground">
        <span className="w-12 text-right">{t.users}</span>
        <span className="w-12 text-right">{t.members}</span>
        <span className="w-12 text-right capitalize">{t.plan}</span>
      </div>
    </Link>
  ));
}


