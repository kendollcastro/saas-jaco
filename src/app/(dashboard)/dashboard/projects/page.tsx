"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import ConfirmModal from "@/components/confirm-modal";
import { Building2, Plus, Trash2, Pencil, ClipboardList, Wallet } from "lucide-react";
import { fmtStoredDate, todayLocalDateOnly } from "@/lib/utils";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function formatDate(d: string | null) {
  if (!d) return "-";
  return fmtStoredDate(d, months);
}
function fmtCR(n: number) {
  return `₡${n.toLocaleString("de-DE")}`;
}

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  cotizado: { label: "Cotizado", bg: "#dbeafe", color: "#1d4ed8" },
  activo: { label: "Activo", bg: "#dcfce7", color: "#15803d" },
  cerrado: { label: "Cerrado", bg: "#f1f5f9", color: "#475569" },
  cancelado: { label: "Cancelado", bg: "#fee2e2", color: "#b91c1c" },
};

const itemUnits = ["unidad", "m2", "m3", "ml", "hora", "sesión", "global", "otros"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemSubmitting, setItemSubmitting] = useState(false);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expSubmitting, setExpSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()).catch(() => []),
    ])
      .then(([p, m]) => {
        setProjects(Array.isArray(p) ? p : []);
        setMembers(Array.isArray(m) ? m : []);
      })
      .catch(() => toast.error("Error al cargar proyectos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: "all", label: "Todos" },
    { key: "cotizado", label: "Cotizados" },
    { key: "activo", label: "Activos" },
    { key: "cerrado", label: "Cerrados" },
    { key: "cancelado", label: "Cancelados" },
  ];

  const filtered = useMemo(() => {
    let list = projects;
    if (statusTab !== "all") list = list.filter((p) => p.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.clientName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, statusTab, search]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description"),
          address: fd.get("address"),
          clientId: fd.get("clientId") || null,
          clientName: fd.get("clientName") || null,
          startDate: fd.get("startDate") || null,
          endDate: fd.get("endDate") || null,
        }),
      });
      if (res.ok) {
        toast.success("Proyecto creado");
        setShowForm(false);
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear proyecto");
      }
    } catch { toast.error("Error al crear proyecto"); }
    finally { setSubmitting(false); }
  }

  async function changeStatus(p: any, status: string) {
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Proyecto ${statusMap[status]?.label || status}`);
        const data = await res.json();
        if (selected?.id === p.id) setSelected(data);
        setEditing(null);
        load();
      } else { toast.error("Error al actualizar"); }
    } catch { toast.error("Error al actualizar"); }
  }

  function askDeleteProject(p: any) {
    setPendingAction(() => async () => {
      const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Proyecto eliminado"); setDetailOpen(false); load(); }
      else toast.error("Error al eliminar");
    });
    setConfirmOpen(true);
  }

  // ---- Partidas ----
  async function submitItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setItemSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const url = editingItem
      ? `/api/projects/${selected.id}/items/${editingItem.id}`
      : `/api/projects/${selected.id}/items`;
    try {
      const res = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: fd.get("description"),
          quantity: fd.get("quantity"),
          unit: fd.get("unit"),
          unitPrice: fd.get("unitPrice"),
        }),
      });
      if (res.ok) {
        toast.success(editingItem ? "Partida actualizada" : "Partida agregada");
        setItemFormOpen(false);
        setEditingItem(null);
        load();
      } else { toast.error("Error al guardar partida"); }
    } catch { toast.error("Error al guardar partida"); }
    finally { setItemSubmitting(false); }
  }

  async function deleteItem(itemId: string) {
    if (!selected) return;
    setPendingAction(() => async () => {
      const res = await fetch(`/api/projects/${selected.id}/items/${itemId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Partida eliminada"); load(); }
      else toast.error("Error al eliminar");
    });
    setConfirmOpen(true);
  }

  // ---- Gastos ----
  async function submitExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setExpSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/projects/${selected.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: fd.get("concept"),
          amount: fd.get("amount"),
          category: fd.get("category"),
          method: fd.get("method"),
          sinpeRef: fd.get("sinpeRef"),
          date: fd.get("date") || null,
          notes: fd.get("notes"),
        }),
      });
      if (res.ok) {
        toast.success("Gasto registrado");
        setExpenseFormOpen(false);
        load();
      } else { toast.error("Error al registrar gasto"); }
    } catch { toast.error("Error al registrar gasto"); }
    finally { setExpSubmitting(false); }
  }

  async function deleteExpense(expId: string) {
    if (!selected) return;
    setPendingAction(() => async () => {
      const res = await fetch(`/api/projects/${selected.id}/expenses/${expId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Gasto eliminado"); load(); }
      else toast.error("Error al eliminar");
    });
    setConfirmOpen(true);
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Proyectos</h1>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition">
          <Plus className="size-4" />
          Nuevo proyecto
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-[10px] p-[3px]">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setStatusTab(t.key)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition cursor-pointer ${
                statusTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {projects.length > 0 && (
          <div className="relative flex-1 max-w-[220px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proyecto..."
              className="w-full pl-8 pr-3 py-[7px] border border-input rounded-[8px] text-[12px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">{search || statusTab !== "all" ? "Sin resultados" : "No hay proyectos aún"}</p>
            <p className="text-sm mt-1 mb-4">Creá un proyecto para cotizar partidas y registrar gastos de obra</p>
            {!search && statusTab === "all" && (
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition">
                <Plus className="size-4" />
                Crear proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Proyecto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cotización</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gastos</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ganancia</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="w-[60px] px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = statusMap[p.status] || statusMap.cotizado;
                  return (
                    <tr key={p.id} className="border-t border-border cursor-pointer hover:bg-muted/30 transition"
                      onClick={() => { setSelected(p); setDetailOpen(true); setEditing(null); }}>
                      <td className="px-5 py-3">
                        <div className="leading-tight">
                          <div className="text-[13.5px] font-bold text-foreground">{p.name}</div>
                          <div className="text-[11.5px] text-muted-foreground">{p.address || p.description || "-"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-muted-foreground">
                        {p.clientName || p.client?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground text-right">{fmtCR(p.cotizacionTotal)}</td>
                      <td className="px-4 py-3 text-[13px] text-red-600 text-right">{fmtCR(p.gastosTotal)}</td>
                      <td className="px-4 py-3 text-[13px] font-bold text-right" style={{ color: p.ganancia >= 0 ? "#15803d" : "#b91c1c" }}>
                        {fmtCR(p.ganancia)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-[11px] py-[4px] rounded-full text-xs font-bold"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); askDeleteProject(p); }}
                          className="text-muted-foreground hover:text-red-500 transition p-1" title="Eliminar">
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form nuevo proyecto */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title="Nuevo proyecto" description="Creá una obra o proyecto">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre del proyecto</label>
              <input name="name" required placeholder="Ej: Remodelación casa en Escazú" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Descripción (opcional)</label>
              <textarea name="description" rows={2} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none" placeholder="Alcance, detalles de la obra..." />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Dirección (opcional)</label>
              <input name="address" placeholder="Provincia, cantón, señas..." className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Cliente (valor)</label>
                <select name="clientId" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="">Ninguno / escribir nombre abajo</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} {m.phone ? `· ${m.phone}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">O nombre libre</label>
                <input name="clientName" placeholder="Nombre del cliente..." className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Inicio</label>
                <input name="startDate" type="date" defaultValue={todayLocalDateOnly()} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Fin estimado</label>
                <input name="endDate" type="date" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : "Crear proyecto"}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Detalle proyecto */}
      <SlideOver open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); setEditing(null); }}
        title={selected?.name || ""} description="Detalle del proyecto">
        {selected && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Cliente</span>
                  <span className="text-[14px] text-foreground">{selected.clientName || selected.client?.name || "-"}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Estado</span>
                  <select value={selected.status} onChange={(e) => changeStatus(selected, e.target.value)}
                    className="px-2 py-1 rounded-lg border border-input text-[12px] font-bold font-sans bg-background cursor-pointer focus:outline-none focus:border-primary">
                    {Object.entries(statusMap).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Inicio</span>
                  <span className="text-[14px] text-muted-foreground">{formatDate(selected.startDate)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Fin</span>
                  <span className="text-[14px] text-muted-foreground">{formatDate(selected.endDate)}</span>
                </div>
              </div>
              {(selected.address || selected.description) && (
                <div className="p-3 bg-muted/50 rounded-xl text-[13px] text-muted-foreground">
                  {selected.address && <p className="font-semibold text-foreground">{selected.address}</p>}
                  {selected.description && <p className="mt-1">{selected.description}</p>}
                </div>
              )}

              {/* Resumen económico */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Cotización</p>
                  <p className="text-[15px] font-extrabold text-blue-800 mt-1">{fmtCR(selected.cotizacionTotal)}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Gastos</p>
                  <p className="text-[15px] font-extrabold text-red-800 mt-1">{fmtCR(selected.gastosTotal)}</p>
                </div>
                <div className="p-3.5 rounded-2xl" style={{ background: selected.ganancia >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selected.ganancia >= 0 ? "#bbf7d0" : "#fecaca"}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: selected.ganancia >= 0 ? "#15803d" : "#b91c1c" }}>Ganancia</p>
                  <p className="text-[15px] font-extrabold mt-1" style={{ color: selected.ganancia >= 0 ? "#15803d" : "#b91c1c" }}>{fmtCR(selected.ganancia)}</p>
                </div>
              </div>

              {/* Partidas */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-4 text-muted-foreground" />
                    <span className="text-[12px] font-extrabold text-foreground uppercase tracking-wide">Cotización / Partidas</span>
                  </div>
                  <button onClick={() => { setEditingItem(null); setItemFormOpen(true); }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-bold border-none cursor-pointer hover:bg-primary/90 transition flex items-center gap-1">
                    <Plus className="size-3.5" /> Agregar
                  </button>
                </div>
                {selected.items.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-muted-foreground">Sin partidas aún. Agregá la cotización del proyecto.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {selected.items.map((i: any) => (
                      <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">{i.description}</p>
                          <p className="text-[11.5px] text-muted-foreground">{i.quantity} {i.unit} × {fmtCR(i.unitPrice)}</p>
                        </div>
                        <span className="text-[13px] font-bold text-foreground">{fmtCR(i.quantity * i.unitPrice)}</span>
                        <button onClick={() => { setEditingItem(i); setItemFormOpen(true); }}
                          className="text-muted-foreground hover:text-primary transition p-1"><Pencil className="size-3.5" /></button>
                        <button onClick={() => deleteItem(i.id)}
                          className="text-muted-foreground hover:text-red-500 transition p-1"><Trash2 className="size-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Total cotización</span>
                      <span className="text-[14px] font-extrabold text-foreground">{fmtCR(selected.cotizacionTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Gastos */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-muted-foreground" />
                    <span className="text-[12px] font-extrabold text-foreground uppercase tracking-wide">Gastos de obra</span>
                  </div>
                  <button onClick={() => setExpenseFormOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold border-none cursor-pointer hover:bg-red-600 transition flex items-center gap-1">
                    <Plus className="size-3.5" /> Registrar
                  </button>
                </div>
                {selected.expenses.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-muted-foreground">Sin gastos registrados.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {selected.expenses.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">{e.concept}</p>
                          <p className="text-[11.5px] text-muted-foreground">
                            {formatDate(e.date)} · {e.category} · {e.method}
                            {e.sinpeRef ? ` · SINPE ${e.sinpeRef}` : ""}
                          </p>
                        </div>
                        <span className="text-[13px] font-bold text-red-600">{fmtCR(e.amount)}</span>
                        <button onClick={() => deleteExpense(e.id)}
                          className="text-muted-foreground hover:text-red-500 transition p-1"><Trash2 className="size-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Total gastos</span>
                      <span className="text-[14px] font-extrabold text-red-600">{fmtCR(selected.gastosTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Form partida */}
      <SlideOver open={itemFormOpen} onClose={() => { setItemFormOpen(false); setEditingItem(null); }}
        title={editingItem ? "Editar partida" : "Nueva partida"} description="Item de la cotización del proyecto">
        <form onSubmit={submitItem} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Descripción</label>
              <input name="description" required defaultValue={editingItem?.description || ""} placeholder="Ej: Instalación de cerámica" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div className="grid grid-cols-3 gap-[12px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Cantidad</label>
                <input name="quantity" type="number" step="any" min="0" defaultValue={editingItem?.quantity ?? 1} className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Unidad</label>
                <select name="unit" defaultValue={editingItem?.unit || "unidad"} className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  {itemUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Precio unit. (₡)</label>
                <input name="unitPrice" type="number" step="any" min="0" defaultValue={editingItem?.unitPrice ?? 0} className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => { setItemFormOpen(false); setEditingItem(null); }} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={itemSubmitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {itemSubmitting ? "Guardando..." : editingItem ? "Guardar cambios" : "Agregar partida"}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Form gasto */}
      <SlideOver open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} title="Registrar gasto" description={`Gasto del proyecto: ${selected?.name || ""}`}>
        <form onSubmit={submitExpense} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Concepto</label>
              <input name="concept" required placeholder="Ej: Compra de cemento" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Monto (₡)</label>
                <input name="amount" type="number" step="any" min="0" className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Categoría</label>
                <select name="category" className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="materiales">Materiales</option>
                  <option value="mano de obra">Mano de obra</option>
                  <option value="transporte">Transporte</option>
                  <option value="permisos">Permisos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Método</label>
                <select name="method" className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="sinpe">SINPE Móvil</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Fecha</label>
                <input name="date" type="date" defaultValue={todayLocalDateOnly()} className="w-full px-[11px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Referencia SINPE (opcional)</label>
              <input name="sinpeRef" placeholder="Número de referencia" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Notas (opcional)</label>
              <textarea name="notes" rows={2} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none" />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setExpenseFormOpen(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={expSubmitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-red-500 text-white cursor-pointer shadow-lg shadow-red-500/20 hover:bg-red-600 transition disabled:opacity-50">
              {expSubmitting ? "Guardando..." : "Registrar gasto"}
            </button>
          </div>
        </form>
      </SlideOver>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { const fn = pendingAction; setConfirmOpen(false); if (fn) fn(); }}
      />
    </div>
  );
}