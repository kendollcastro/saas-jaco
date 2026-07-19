"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Search, ArrowRight, Users, Calendar, Dumbbell, AlertCircle, ChevronLeft, ChevronRight, Plus, X, Store, Tag } from "lucide-react";

const PAGE_SIZE = 10;

const BUSINESS_TYPES = [
  { value: "tourism", label: "Turismo" },
  { value: "gym", label: "Gimnasio" },
  { value: "clinic", label: "Clínica" },
  { value: "retail", label: "Tienda" },
  { value: "restaurant", label: "Restaurante" },
  { value: "other", label: "Otro" },
];

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createBusinessType, setCreateBusinessType] = useState("tourism");
  const [createCategory, setCreateCategory] = useState("");
  const [availableModules, setAvailableModules] = useState<{ key: string; name: string; selected: boolean }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/tenants").then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); }),
      fetch("/api/admin/modules").then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); }),
    ])
      .then(([t, mods]) => {
        setTenants(t);
        setAvailableModules(mods.map((m: any) => ({ key: m.key, name: m.name, selected: m.key === "bookings" || m.key === "staff" })));
      })
      .catch(() => { setError(true); toast.error("Error al cargar datos"); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTenants = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <h1 className="text-[21px] font-extrabold tracking-tight text-foreground mb-6">Tenants</h1>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tenant..."
            className="w-full pl-9 pr-4 py-2.5 border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="size-[15px]" />
          Nuevo
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,.5)] animate-[jacoFade_0.15s_ease]" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-foreground">Crear tenant</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition">
                <X className="size-[18px]" />
              </button>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre del negocio</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ej: Gimnasio Fit Jacó"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Email del administrador</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Contraseña</label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px] flex items-center gap-1.5">
                <Store className="size-[14px]" /> Tipo de negocio
              </label>
              <select
                value={createBusinessType}
                onChange={(e) => setCreateBusinessType(e.target.value)}
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px] flex items-center gap-1.5">
                <Tag className="size-[14px]" /> Categoría (opcional)
              </label>
              <input
                type="text"
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
                placeholder="Ej: CrossFit, Yoga, Surf"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Módulos activos</label>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {availableModules.map((mod) => (
                  <label key={mod.key} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={mod.selected}
                      onChange={() => setAvailableModules((prev) => prev.map((m) => m.key === mod.key ? { ...m, selected: !m.selected } : m))}
                      className="accent-primary"
                    />
                    <span className="text-[13px] font-semibold text-foreground/80 group-hover:text-foreground transition">{mod.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!createName || !createEmail || !createPassword) return toast.error("Completá todos los campos");
                setCreating(true);
                try {
                  const res = await fetch("/api/admin/tenants", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: createName,
                      email: createEmail,
                      password: createPassword,
                      businessType: createBusinessType,
                      category: createCategory || null,
                      modules: availableModules.filter((m) => m.selected).map((m) => m.key),
                    }),
                  });
                  if (res.ok) {
                    toast.success("Tenant creado. El cliente ya puede iniciar sesión.");
                    setShowCreate(false);
                    setCreateName("");
                    setCreateEmail("");
                    setCreatePassword("");
                    setCreateBusinessType("tourism");
                    setCreateCategory("");
                    setAvailableModules((prev) => prev.map((m) => ({ ...m, selected: m.key === "bookings" || m.key === "staff" })));
                    setLoading(true);
                    fetch("/api/admin/tenants").then(r => r.json()).then(setTenants).catch(() => toast.error("Error al recargar")).finally(() => setLoading(false));
                  } else {
                    const err = await res.json();
                    toast.error(err.error || "Error al crear");
                  }
                } catch {
                  toast.error("Error al crear tenant");
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating}
              className="w-full py-[11px] rounded-[10px] bg-primary text-primary-foreground text-[14px] font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear tenant"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[66px] bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <AlertCircle className="size-10 mx-auto mb-3 text-destructive" />
          <p className="text-[14px] font-semibold text-muted-foreground">Error al cargar tenants</p>
          <button
            onClick={() => { setError(false); setLoading(true); fetch("/api/admin/tenants").then(r => r.json()).then(setTenants).catch(() => setError(true)).finally(() => setLoading(false)); }}
            className="mt-4 text-[13px] font-bold text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <Building2 className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[14px] font-semibold text-muted-foreground">{search ? "Sin resultados" : "No hay tenants"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageTenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center justify-between bg-card rounded-xl px-5 py-3.5 border border-border hover:border-primary/30 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${t.active ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-foreground truncate flex items-center gap-2">
                      {t.name}
                      {!t.active && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Suspendido</span>}
                    </div>
                    <div className="text-[12px] text-muted-foreground">{t.email}</div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Users className="size-[14px]" /> {t.users}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Calendar className="size-[14px]" /> {t.bookings}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Dumbbell className="size-[14px]" /> {t.members}
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {t.activeModules.map((m: any) => (
                      <span key={m.key} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{m.name}</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t.plan}</span>
                  <ArrowRight className="size-[15px] text-muted-foreground/40" />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-[13px]">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronLeft className="size-[15px]" /> Anterior
              </button>
              <span className="text-muted-foreground">
                Página {page + 1} de {totalPages} ({filtered.length} total)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                Siguiente <ChevronRight className="size-[15px]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
