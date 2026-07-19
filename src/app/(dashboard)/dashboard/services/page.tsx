"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import { Tent } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";
import { serviceSchema } from "@/lib/validations";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: number | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function loadServices() {
    setLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar servicios"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadServices(); }, []);

  function getFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    return {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      price: fd.get("price") as string,
      duration: fd.get("duration") as string,
    };
  }

  function deleteService(id: string) {
    setPendingAction(() => async () => {
      try {
        const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Servicio eliminado");
          loadServices();
        } else {
          toast.error("Error al eliminar");
        }
      } catch {
        toast.error("Error al eliminar");
      }
    });
    setConfirmOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const data = getFormData(e.currentTarget);
    const parsed = serviceSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        toast.success("Servicio creado");
        setShowForm(false);
        loadServices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear servicio");
      }
    } catch {
      toast.error("Error al crear servicio");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">
          Servicios
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo servicio
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tent className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">No hay servicios aún</p>
            <p className="text-sm mt-1 mb-4">Agregá los servicios que ofrecés (clases, tours, consultas, etc.)</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Crear servicio
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Precio</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Duración</th>
                  <th className="w-[60px] px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-5 py-3 text-[13.5px] font-semibold text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-[13.5px] text-muted-foreground">
                      {s.price ? `₡${s.price.toLocaleString("de-DE")}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-muted-foreground">
                      {s.duration ? `${s.duration} min` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-muted-foreground hover:text-red-500 transition p-1"
                        title="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo servicio"
        description="Agrega un nuevo servicio a tu catálogo."
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre del servicio</label>
              <input name="name" required placeholder="Ej: Clase de surf, Tour ATV" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Precio (₡)</label>
                <input name="price" type="number" placeholder="45000" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Duración (min)</label>
                <input name="duration" type="number" placeholder="120" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Descripción</label>
              <textarea name="description" rows={3} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition resize-none" placeholder="Descripción opcional del servicio..." />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : "Guardar servicio"}
            </button>
          </div>
        </form>
      </SlideOver>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={() => { pendingAction?.(); setConfirmOpen(false); setPendingAction(null); }}
        title="Eliminar servicio"
        message="¿Eliminar este servicio? Esta acción no se puede deshacer."
        variant="danger"
      />
    </div>
  );
}
