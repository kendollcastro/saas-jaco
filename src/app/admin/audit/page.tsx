"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrollText, ChevronLeft, ChevronRight, Building2, Filter } from "lucide-react";

interface Event {
  id: string;
  type: string;
  description: string;
  tenantName: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  "tenant.activated": "Tenant Activado",
  "tenant.suspended": "Tenant Suspendido",
  "tenant.plan_changed": "Plan Cambiado",
  "ticket.closed": "Ticket Cerrado",
  "ticket.reopened": "Ticket Reabierto",
  "maintenance.on": "Mantenimiento ON",
  "maintenance.off": "Mantenimiento OFF",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([key, label]) => ({ key, label }));

export default function AdminAuditPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => { loadEvents(); }, [page, typeFilter]);

  async function loadEvents() {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      setEvents(data.events);
      setTotalPages(data.totalPages);
    } catch { toast.error("Error al cargar auditoría"); }
    finally { setLoading(false); }
  }

  type EventType = keyof typeof TYPE_LABELS;

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Auditoría</h1>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-4 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Todos los eventos</option>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-1.5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <ScrollText className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[14px] font-semibold text-muted-foreground">No hay eventos registrados</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 bg-card rounded-xl px-5 py-3.5 border border-border">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.type.startsWith("tenant.") ? "bg-blue-500" : e.type.startsWith("ticket.") ? "bg-amber-500" : "bg-purple-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{e.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground">{TYPE_LABELS[e.type as EventType] || e.type}</span>
                    {e.tenantName && (
                      <>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="size-3" /> {e.tenantName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {new Date(e.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-[13px]">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition">
                <ChevronLeft className="size-[15px]" /> Anterior
              </button>
              <span className="text-muted-foreground">Página {page} de {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition">
                Siguiente <ChevronRight className="size-[15px]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
