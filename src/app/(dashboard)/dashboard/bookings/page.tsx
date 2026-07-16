"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import { Calendar } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import ConfirmModal from "@/components/confirm-modal";
import { bookingSchema } from "@/lib/validations";

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 20;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((b) => b.id)));
    }
  }

  async function batchUpdateStatus(status: string) {
    if (selectedIds.size === 0) return;
    const labels: Record<string, string> = { confirmed: "Confirmar", cancelled: "Cancelar", completed: "Completar" };
    const label = labels[status] || status;
    setPendingAction(() => async () => {
      for (const id of selectedIds) {
        await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }
      toast.success(`${selectedIds.size} reserva${selectedIds.size !== 1 ? "s" : ""} ${label === "Cancelar" ? "canceladas" : label.toLowerCase() + "das"}`);
      setSelectedIds(new Set());
      setConfirmOpen(false);
      loadBookings();
    });
    setConfirmOpen(true);
  }

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.customerName?.toLowerCase().includes(q) && !b.customerPhone?.includes(q)) return false;
      }
      if (statusFilter && b.status !== statusFilter) return false;
      if (dateFrom && new Date(b.date) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(b.date) > end) return false;
      }
      return true;
    });
  }, [bookings, search, statusFilter, dateFrom, dateTo]);

  const paginatedData = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function loadBookings() {
    setLoading(true);
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar reservas"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { loadBookings(); }, []);

  function getFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    return {
      customerName: fd.get("customerName") as string,
      customerPhone: fd.get("customerPhone") as string,
      customerEmail: fd.get("customerEmail") as string,
      serviceName: fd.get("serviceName") as string,
      date: fd.get("date") as string,
      time: fd.get("time") as string,
      pax: fd.get("pax") as string,
      total: fd.get("total") as string,
      deposit: fd.get("deposit") as string,
      notes: fd.get("notes") as string,
    };
  }

  function openDetail(b: any) {
    setSelectedBooking(b);
    setDetailOpen(true);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Estado actualizado");
        loadBookings();
        setSelectedBooking((prev: any) => prev ? { ...prev, status } : null);
      } else {
        toast.error("Error al actualizar estado");
      }
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const data = getFormData(e.currentTarget);
    const parsed = bookingSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        toast.success("Reserva creada");
        setShowForm(false);
        loadBookings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear reserva");
      }
    } catch {
      toast.error("Error al crear reserva");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">
          Reservas
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva reserva
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-9 pr-3 py-[9px] border border-input rounded-[10px] text-[13px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-[9px] border border-input rounded-[10px] text-[13px] font-semibold font-sans text-muted-foreground bg-background focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-[9px] border border-input rounded-[10px] text-[13px] font-sans text-muted-foreground bg-background focus:outline-none focus:border-primary"
          title="Desde"
        />
        <span className="text-muted-foreground text-[13px] font-semibold -mx-1">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-[9px] border border-input rounded-[10px] text-[13px] font-sans text-muted-foreground bg-background focus:outline-none focus:border-primary"
          title="Hasta"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">No hay reservas</p>
            <p className="text-sm mt-1 mb-4">
              {search || statusFilter || dateFrom ? "Ninguna reserva coincide con los filtros" : "Crea la primera reserva para empezar"}
            </p>
            {!search && !statusFilter && !dateFrom && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nueva reserva
              </button>
            )}
          </div>
        ) : (
          <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
              <span className="text-[13px] font-bold text-foreground">{selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}</span>
              <div className="flex gap-1.5 ml-auto">
                <button onClick={() => batchUpdateStatus("confirmed")} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-bold border-none cursor-pointer hover:bg-primary/90 transition">
                  Confirmar
                </button>
                <button onClick={() => batchUpdateStatus("completed")} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[12px] font-bold border-none cursor-pointer hover:bg-blue-600 transition">
                  Completar
                </button>
                <button onClick={() => batchUpdateStatus("cancelled")} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold border-none cursor-pointer hover:bg-red-600 transition">
                  Cancelar
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground cursor-pointer hover:bg-muted transition">
                  Limpiar
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="w-[40px] px-3 py-3">
                    <input type="checkbox" checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                      onChange={toggleSelectAll}
                      className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                  </th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Servicio</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="text-center px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Personas</th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((b: any) => {
                  const st = statusConfig[b.status] || statusConfig.pending;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => openDetail(b)}
                      className={`border-t border-border cursor-pointer hover:bg-muted transition ${selectedIds.has(b.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)}
                          className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-xs flex-shrink-0 bg-primary/10 text-primary"
                          >
                            {(b.customerName || "").split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <div className="text-[13.5px] font-bold text-foreground">{b.customerName}</div>
                            <div className="text-[11.5px] text-muted-foreground">{formatPhone(b.customerPhone) || b.customerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[13.5px] font-semibold text-muted-foreground">{b.serviceName}</td>
                      <td className="px-3 py-3 text-[13.5px] text-muted-foreground">{formatDate(b.date)}</td>
                      <td className="px-3 py-3 text-[13.5px] font-bold text-foreground text-center">{b.pax}</td>
                      <td className="px-3 py-3 text-[13.5px] font-bold text-foreground text-right">
                        {b.total ? `₡${b.total.toLocaleString("de-DE")}` : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-flex items-center px-[11px] py-[4px] rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pb-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground bg-card hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page <= 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground bg-card hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
          </>
        )}
      </div>

      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva reserva"
        description="Completa los datos del cliente y el servicio."
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre del cliente</label>
              <input name="customerName" required placeholder="Ej. Carlos Jiménez" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Teléfono</label>
                <input name="customerPhone" type="tel" placeholder="+506 8888 8888" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Email</label>
                <input name="customerEmail" type="email" placeholder="correo@mail.com" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
                {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail[0]}</p>}
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Servicio</label>
              <input name="serviceName" required placeholder="Ej: Clase de surf, Tour ATV, Pesca" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              {errors.serviceName && <p className="text-red-500 text-xs mt-1">{errors.serviceName[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Fecha</label>
                <input name="date" type="date" required className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date[0]}</p>}
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Hora</label>
                <input name="time" type="time" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Número de personas</label>
              <input name="pax" type="number" min="1" defaultValue="1" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              {errors.pax && <p className="text-red-500 text-xs mt-1">{errors.pax[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Total (₡)</label>
                <input name="total" type="number" placeholder="90000" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Depósito (₡)</label>
                <input name="deposit" type="number" placeholder="30000" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Notas</label>
              <textarea name="notes" rows={3} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition resize-none" placeholder="Notas adicionales..." />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : "Crear reserva"}
            </button>
          </div>
        </form>
      </SlideOver>

      <SlideOver
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedBooking(null); }}
        title="Detalle de reserva"
        description={selectedBooking?.customerName || ""}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Cliente</span>
                <span className="text-[14px] font-bold text-foreground">{selectedBooking?.customerName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Contacto</span>
                <span className="text-[14px] text-muted-foreground">{formatPhone(selectedBooking?.customerPhone) || selectedBooking?.customerEmail || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Servicio</span>
                <span className="text-[14px] font-bold text-foreground">{selectedBooking?.serviceName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Fecha</span>
                <span className="text-[14px] text-muted-foreground">{selectedBooking?.date ? formatDate(selectedBooking.date) : ""}{selectedBooking?.time ? ` ${selectedBooking.time}` : ""}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Personas</span>
                <span className="text-[14px] font-bold text-foreground">{selectedBooking?.pax}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Total</span>
                <span className="text-[14px] font-bold text-foreground">{selectedBooking?.total ? `₡${selectedBooking.total.toLocaleString("de-DE")}` : "-"}</span>
              </div>
              {selectedBooking?.deposit ? (
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Depósito</span>
                  <span className="text-[14px] font-bold text-foreground">₡{selectedBooking.deposit.toLocaleString("de-DE")}</span>
                </div>
              ) : null}
            </div>

            {selectedBooking?.notes ? (
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notas</span>
                <p className="text-[13.5px] text-muted-foreground bg-muted rounded-[10px] p-3">{selectedBooking.notes}</p>
              </div>
            ) : null}

            <hr className="border-border" />

            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">Estado</span>
              <div className="flex flex-wrap gap-2">
                {["pending", "confirmed", "completed", "cancelled"].map((st) => {
                  const cfg = statusConfig[st] || { label: st, bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" };
                  const active = selectedBooking?.status === st;
                  return (
                    <button
                      key={st}
                      disabled={updating || active}
                      onClick={() => updateStatus(selectedBooking.id, st)}
                      className="px-3 py-[7px] rounded-full text-xs font-bold border-none cursor-pointer transition disabled:opacity-50 disabled:cursor-default"
                      style={{
                        background: active ? cfg.bg : "hsl(var(--muted))",
                        color: active ? cfg.color : "hsl(var(--muted-foreground))",
                        outline: active ? `2px solid ${cfg.color}30` : "none",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button
              onClick={() => {
                setPendingAction(() => async () => {
                  try {
                    const res = await fetch(`/api/bookings/${selectedBooking.id}`, { method: "DELETE" });
                    if (res.ok) {
                      toast.success("Reserva eliminada");
                      setDetailOpen(false);
                      setSelectedBooking(null);
                      loadBookings();
                    } else {
                      toast.error("Error al eliminar");
                    }
                  } catch {
                    toast.error("Error al eliminar");
                  }
                });
                setConfirmOpen(true);
              }}
              className="px-4 py-[10px] border border-red-200 rounded-[10px] text-[13px] font-bold font-sans bg-background text-red-500 cursor-pointer hover:bg-red-50 transition"
            >
              Eliminar reserva
            </button>
            <button
              onClick={() => { setDetailOpen(false); setSelectedBooking(null); }}
              className="flex-1 py-[10px] border border-input rounded-[10px] text-[13px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </SlideOver>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={() => { pendingAction?.(); setConfirmOpen(false); setPendingAction(null); }}
        title="Eliminar reserva"
        message="¿Eliminar esta reserva? Esta acción no se puede deshacer."
        variant="danger"
      />
    </div>
  );
}
