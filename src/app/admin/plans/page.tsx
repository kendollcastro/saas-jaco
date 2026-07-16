"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CircleCheck, CircleX, ChevronDown, ChevronUp } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  interval: string;
  active: boolean;
  sortOrder: number;
  moduleKeys: string[];
  modules: { key: string; name: string }[];
}

const MODULE_OPTIONS = [
  { key: "bookings", name: "Reservas" },
  { key: "staff", name: "Staff" },
  { key: "memberships", name: "Socios y Membresías" },
  { key: "inventory", name: "Inventario y Productos" },
  { key: "invoicing", name: "Facturación Electrónica" },
  { key: "menu", name: "Menú Digital" },
];

const emptyForm = { name: "", slug: "", description: "", price: 0, interval: "monthly", active: true, sortOrder: 0, moduleKeys: [] as string[] };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      setPlans(await res.json());
    } catch { toast.error("Error al cargar planes"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    setForm({ name: plan.name, slug: plan.slug, description: plan.description || "", price: plan.price, interval: plan.interval, active: plan.active, sortOrder: plan.sortOrder, moduleKeys: [...plan.moduleKeys] });
    setEditingId(plan.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.slug) { toast.error("Nombre y slug requeridos"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success(editingId ? "Plan actualizado" : "Plan creado");
      setShowForm(false);
      loadPlans();
    } catch { toast.error("Error de red"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/plans/${deleteId}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Plan eliminado");
      loadPlans();
    } catch { toast.error("Error de red"); }
    finally { setDeleteId(null); }
  }

  function toggleModule(key: string) {
    setForm((prev) => ({
      ...prev,
      moduleKeys: prev.moduleKeys.includes(key)
        ? prev.moduleKeys.filter((k) => k !== key)
        : [...prev.moduleKeys, key],
    }));
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Planes</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-[10px] text-[12px] font-bold hover:bg-primary/90 transition">
          <Plus className="size-[15px]" /> Nuevo Plan
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <p className="text-[14px] font-semibold text-muted-foreground">No hay planes creados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    {expanded === plan.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-extrabold text-foreground">{plan.name}</span>
                      {plan.active ? <CircleCheck className="size-3.5 text-emerald-500" /> : <CircleX className="size-3.5 text-red-400" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">/{plan.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[14px] font-extrabold text-foreground">
                      {plan.price === 0 ? "Gratis" : `$${(plan.price / 100).toFixed(2)}`}
                      {plan.price > 0 && <span className="text-[11px] font-semibold text-muted-foreground">/{plan.interval === "yearly" ? "año" : "mes"}</span>}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{plan.moduleKeys.length} módulos</div>
                  </div>
                  <button onClick={() => openEdit(plan)} className="p-2 text-muted-foreground hover:text-foreground transition"><Pencil className="size-[15px]" /></button>
                  <button onClick={() => setDeleteId(plan.id)} className="p-2 text-muted-foreground hover:text-red-500 transition"><Trash2 className="size-[15px]" /></button>
                </div>
              </div>
              {expanded === plan.id && (
                <div className="px-5 pb-4 pt-0 border-t border-border/40">
                  {plan.description && <p className="text-[12px] text-muted-foreground mb-2">{plan.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {plan.modules.map((m) => (
                      <span key={m.key} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{m.name}</span>
                    ))}
                    {plan.modules.length === 0 && <span className="text-[10px] text-muted-foreground">Sin módulos asignados</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-extrabold text-foreground">{editingId ? "Editar Plan" : "Nuevo Plan"}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro" className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="pro" className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 font-mono" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descripción del plan..." className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Precio (centavos)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20" />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">$ {(form.price / 100).toFixed(2)}</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Intervalo</label>
                <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20">
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Módulos incluidos</label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODULE_OPTIONS.map((mod) => (
                  <label key={mod.key} className="flex items-center gap-2 py-1.5 px-2 rounded-[8px] hover:bg-muted/30 transition cursor-pointer">
                    <input type="checkbox" checked={form.moduleKeys.includes(mod.key)} onChange={() => toggleModule(mod.key)} className="rounded border-border text-primary focus:ring-primary/30" />
                    <span className="text-[12px] font-semibold text-foreground/80">{mod.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-border text-primary focus:ring-primary/30" />
                <span className="text-[12px] font-semibold text-foreground/80">Plan activo</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} disabled={saving} className="px-4 py-2 rounded-[10px] border border-border text-[12px] font-bold text-muted-foreground hover:bg-muted transition disabled:opacity-50">Cancelar</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 rounded-[10px] bg-primary text-white text-[12px] font-bold hover:bg-primary/90 transition disabled:opacity-50">{saving ? "..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar plan"
        message="¿Eliminar este plan? Los tenants asignados a este plan se quedarán sin plan si no lo cambias antes."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
