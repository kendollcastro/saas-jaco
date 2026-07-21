"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, Tag, DollarSign, Clock, Power, PowerOff, Pencil, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  active: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ plan: Plan; action: "toggle" | "delete" } | null>(null);

  const [form, setForm] = useState({ name: "", description: "", price: "", durationDays: "30" });

  function load() {
    setLoading(true);
    fetch("/api/membership-plans")
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar planes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "", durationDays: "30" });
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({ name: plan.name, description: plan.description || "", price: String(plan.price), durationDays: String(plan.durationDays) });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nombre requerido");
    setSubmitting(true);

    try {
      const url = editing ? `/api/membership-plans/${editing.id}` : "/api/membership-plans";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price) || 0,
          durationDays: Number(form.durationDays) || 30,
        }),
      });

      if (res.ok) {
        toast.success(editing ? "Plan actualizado" : "Plan creado");
        setShowForm(false);
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(plan: Plan) {
    try {
      const res = await fetch(`/api/membership-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      });
      if (res.ok) {
        toast.success(plan.active ? "Plan desactivado" : "Plan activado");
        load();
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setConfirmAction(null);
    }
  }

  async function deletePlan(plan: Plan) {
    try {
      const res = await fetch(`/api/membership-plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Plan eliminado");
        load();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setConfirmAction(null);
    }
  }

  const planColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Planes de membresía</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Personalizá los tipos de membresía que ofrecés</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <Plus className="size-[16px]" />
          Nuevo plan
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,.5)] animate-[jacoFade_0.15s_ease]" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-extrabold text-foreground">{editing ? "Editar plan" : "Nuevo plan"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition">
                <X className="size-[18px]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px] flex items-center gap-1.5">
                  <Tag className="size-[14px]" /> Nombre del plan
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: 3 días/semana"
                  className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Descripción (opcional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Ej: Acceso 3 veces por semana"
                  className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px] flex items-center gap-1.5">
                    <DollarSign className="size-[14px]" /> Precio ₡
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="0"
                    className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px] flex items-center gap-1.5">
                    <Clock className="size-[14px]" /> Duración (días)
                  </label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
                    placeholder="30"
                    className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-[11px] rounded-[10px] bg-primary text-primary-foreground text-[14px] font-bold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear plan"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmAction?.action === "toggle"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && toggleActive(confirmAction.plan)}
        title={confirmAction?.plan.active ? "Desactivar plan" : "Activar plan"}
        message={
          confirmAction?.plan.active
            ? `¿Desactivar "${confirmAction?.plan.name}"? Los socios con este plan no se verán afectados, pero no podrás asignarlo a nuevos socios.`
            : `¿Activar "${confirmAction?.plan.name}"? Estará disponible para nuevos socios.`
        }
        confirmText={confirmAction?.plan.active ? "Desactivar" : "Activar"}
        variant={confirmAction?.plan.active ? "danger" : "default"}
      />

      <ConfirmModal
        open={confirmAction?.action === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && deletePlan(confirmAction.plan)}
        title="Eliminar plan"
        message={`¿Eliminar "${confirmAction?.plan.name}"? Los socios con este plan pasarán a no tener plan asignado.`}
        confirmText="Eliminar"
        variant="danger"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <Tag className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[14px] font-bold text-foreground mb-1">No hay planes de membresía</p>
          <p className="text-[13px] text-muted-foreground mb-4">Creá planes como &quot;Mensual ilimitado&quot; o &quot;3 días/semana&quot; con su precio y duración.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
          >
            <Plus className="size-[16px]" />
            Crear primer plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl border shadow-sm p-5 transition ${
                plan.active ? "border-border" : "border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ background: planColors[idx % planColors.length] }}
                  />
                  <h3 className="text-[15px] font-extrabold text-foreground">{plan.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title="Editar"
                  >
                    <Pencil className="size-[14px]" />
                  </button>
                  <button
                    onClick={() => setConfirmAction({ plan, action: plan.active ? "toggle" : "toggle" })}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title={plan.active ? "Desactivar" : "Activar"}
                  >
                    {plan.active ? <Power className="size-[14px]" /> : <PowerOff className="size-[14px]" />}
                  </button>
                  <button
                    onClick={() => setConfirmAction({ plan, action: "delete" })}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="size-[14px]" />
                  </button>
                </div>
              </div>

              {plan.description && (
                <p className="text-[12.5px] text-muted-foreground mb-3 leading-relaxed">{plan.description}</p>
              )}

              <div className="flex items-center gap-4 text-[13px]">
                <span className="font-bold text-foreground">
                  ₡{plan.price.toLocaleString("es-CR")}
                </span>
                <span className="text-muted-foreground">
                  {plan.durationDays} días
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
