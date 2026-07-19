"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Building2, Users, Calendar, ShoppingCart, Package, Dumbbell, FileText, Activity, AlertCircle, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "activate" | "delete" | null>(null);
  const [modifying, setModifying] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); })
      .then(setTenant)
      .catch(() => { setError(true); toast.error("Error al cargar datos"); })
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleActive() {
    if (!tenant || modifying) return;
    setModifying(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tenant.active }),
      });
      if (res.ok) {
        setTenant((prev: any) => ({ ...prev, active: !prev.active }));
        toast.success(tenant.active ? "Tenant suspendido" : "Tenant activado");
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setModifying(false);
      setConfirmAction(null);
    }
  }

  async function deleteTenant() {
    if (!tenant || modifying) return;
    setModifying(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tenant eliminado");
        router.push("/admin/tenants");
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setModifying(false);
      setConfirmAction(null);
    }
  }

  async function toggleModule(key: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: [{ key, active }] }),
      });
      if (res.ok) {
        setTenant((prev: any) => ({
          ...prev,
          modules: prev.modules.map((m: any) => (m.key === key ? { ...m, active } : m)),
        }));
        toast.success(`Módulo ${active ? "activado" : "desactivado"}`);
      } else {
        toast.error("Error al actualizar módulo");
      }
    } catch {
      toast.error("Error de red");
    }
  }

  if (loading) {
    return (
      <div className="animate-[jacoFade_0.25s_ease] max-w-4xl space-y-5">
        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-48 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border">
              <div className="w-8 h-8 rounded-[8px] bg-muted animate-pulse mb-3" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 bg-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="animate-[jacoFade_0.25s_ease] max-w-4xl">
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <AlertCircle className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[14px] font-semibold text-muted-foreground">Tenant no encontrado</p>
          <button onClick={() => router.back()} className="mt-4 text-[13px] font-bold text-primary hover:underline">Volver</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Usuarios", value: tenant.stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Reservas", value: tenant.stats.bookings, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Socios", value: tenant.stats.members, icon: Dumbbell, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Servicios", value: tenant.stats.services, icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Productos", value: tenant.stats.products, icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Ventas", value: tenant.stats.sales, icon: ShoppingCart, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Facturas", value: tenant.stats.invoices, icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground hover:text-foreground mb-4 transition">
        <ArrowLeft className="size-[15px]" />
        Volver
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${tenant.active ? "bg-emerald-500" : "bg-red-400"}`} />
          <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">{tenant.name}</h1>
          {!tenant.active && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Suspendido</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmAction("delete")}
            disabled={modifying}
            className="px-4 py-2 rounded-[10px] text-[12px] font-bold border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="size-[14px]" />
            Eliminar
          </button>
          <button
            onClick={() => setConfirmAction(tenant.active ? "suspend" : "activate")}
            disabled={modifying}
            className={`px-4 py-2 rounded-[10px] text-[12px] font-bold border transition disabled:opacity-50 ${
              tenant.active
                ? "text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-emerald-500 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
            }`}
          >
            {modifying ? "..." : tenant.active ? "Suspender" : "Activar"}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmAction === "suspend" || confirmAction === "activate"}
        onClose={() => setConfirmAction(null)}
        onConfirm={toggleActive}
        title={confirmAction === "suspend" ? "Suspender tenant" : "Activar tenant"}
        message={
          confirmAction === "suspend"
            ? `¿Estás seguro de suspender a "${tenant.name}"? Todos los usuarios perderán acceso al dashboard hasta que lo reactives.`
            : `¿Activar a "${tenant.name}"? Los usuarios podrán acceder nuevamente.`
        }
        confirmText={confirmAction === "suspend" ? "Suspender" : "Activar"}
        variant={confirmAction === "suspend" ? "danger" : "default"}
      />

      <ConfirmModal
        open={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={deleteTenant}
        title="Eliminar tenant"
        message={`¿Estás seguro de eliminar permanentemente a "${tenant.name}"? Se borrarán todos los datos asociados (usuarios, reservas, socios, productos, etc.). Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />

      <div className="text-[13px] text-muted-foreground mb-6 space-y-0.5">
        <p><span className="font-bold text-foreground">Email:</span> {tenant.email}</p>
        <p><span className="font-bold text-foreground">Slug:</span> {tenant.slug}</p>
        <p><span className="font-bold text-foreground">Plan:</span> <span className="text-foreground capitalize">{tenant.plan}</span></p>
        <p><span className="font-bold text-foreground">Creado:</span> {new Date(tenant.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}</p>
        {tenant.settings?.businessType && <p><span className="font-bold text-foreground">Tipo:</span> <span className="text-foreground capitalize">{tenant.settings.businessType}</span></p>}
        {tenant.settings?.category && <p><span className="font-bold text-foreground">Categoría:</span> <span className="text-foreground">{tenant.settings.category}</span></p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-[8px] ${c.bg} flex items-center justify-center`}>
                <c.icon className={`size-[15px] ${c.color}`} />
              </div>
            </div>
            <div className="text-[20px] font-extrabold text-foreground">{c.value}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="size-[16px] text-primary" />
            <h2 className="text-[14.5px] font-extrabold text-foreground">Módulos</h2>
          </div>
          <span className="text-[10px] text-muted-foreground">Cambiar plan para auto-sincronizar</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tenant.modules.map((mod: any) => (
            <label
              key={mod.key}
              className="flex items-center justify-between py-2.5 px-3.5 rounded-[10px] border border-border hover:bg-muted/30 transition cursor-pointer"
            >
              <span className="text-[13px] font-bold text-foreground/80">{mod.name}</span>
              <div className="relative">
                <input type="checkbox" checked={mod.active} onChange={() => toggleModule(mod.key, !mod.active)} className="sr-only" id={`mod-${mod.key}`} />
                <label htmlFor={`mod-${mod.key}`} className={`block w-[38px] h-[21px] rounded-full transition cursor-pointer ${mod.active ? "bg-primary" : "bg-muted-foreground/25"}`}>
                  <span className={`block w-[15px] h-[15px] bg-white rounded-full shadow-sm mt-[3px] transition ${mod.active ? "translate-x-[20px]" : "translate-x-[3px]"}`} />
                </label>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
