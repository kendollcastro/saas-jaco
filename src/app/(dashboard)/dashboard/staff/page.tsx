"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import { Users } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";
import { staffSchema } from "@/lib/validations";

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function loadStaff() {
    setLoading(true);
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => setStaff(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar staff"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadStaff(); }, []);

  function getFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    return {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string,
      role: fd.get("role") as string,
    };
  }

  function deleteStaff(id: string) {
    setPendingAction(() => async () => {
      try {
        const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Miembro eliminado");
          loadStaff();
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
    const parsed = staffSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        toast.success("Miembro agregado");
        setShowForm(false);
        loadStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al agregar miembro");
      }
    } catch {
      toast.error("Error al agregar miembro");
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabels: Record<string, string> = {
    instructor: "Instructor",
    guide: "Guía",
    driver: "Chofer",
    admin: "Administrativo",
  };

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">
          Staff
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar instructor
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">No hay personal registrado</p>
            <p className="text-sm mt-1">Agrega instructores, guías y staff</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rol</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contacto</th>
                  <th className="w-[60px] px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-xs flex-shrink-0 bg-primary/10 text-primary"
                        >
                          {s.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                        </div>
                        <div className="text-[13.5px] font-bold text-foreground">{s.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-muted-foreground">
                      {s.role ? roleLabels[s.role] || s.role : "-"}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-muted-foreground">
                      {s.phone || s.email || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteStaff(s.id)}
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
        title="Nuevo miembro"
        description="Agrega un instructor, guía o staff."
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre completo</label>
              <input name="name" required placeholder="Ej. Diego Mora" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Teléfono</label>
                <input name="phone" placeholder="+506 8888 8888" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Email</label>
                <input name="email" type="email" placeholder="staff@email.com" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Rol</label>
              <select name="role" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition">
                <option value="">Seleccionar rol</option>
                <option value="instructor">Instructor</option>
                <option value="guide">Guía</option>
                <option value="driver">Chofer</option>
                <option value="admin">Administrativo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : "Guardar miembro"}
            </button>
          </div>
        </form>
      </SlideOver>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={() => { pendingAction?.(); setConfirmOpen(false); setPendingAction(null); }}
        title="Eliminar miembro"
        message="¿Eliminar este miembro del staff? Esta acción no se puede deshacer."
        variant="danger"
      />
    </div>
  );
}
