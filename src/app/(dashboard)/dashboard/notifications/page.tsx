"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { waPhone } from "@/lib/phone";
import { Clock, CircleAlert, CheckCircle } from "lucide-react";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getWhatsAppLink(phone: string, memberName: string, endDate: string | null) {
  const cleaned = waPhone(phone);
  const days = daysRemaining(endDate);
  let text = "";
  if (days !== null && days >= 0) {
    text = `Hola ${memberName}, 🏋️ Te recordamos que tu membresía vence el ${endDate ? formatDate(endDate) : "pronto"}. ¡Renueva y sigue entrenando! 💪`;
  } else {
    text = `Hola ${memberName}, 🙌 Tu membresía está vencida. ¡Renueva hoy y vuelve al gym! 💪`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

const membershipLabels: Record<string, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export default function NotificationsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  function load() {
    setLoading(true);
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar socios"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const upcoming = useMemo(
    () => members
      .filter((m) => {
        const days = daysRemaining(m.endDate);
        return days !== null && days >= 0 && days <= 7 && m.status === "active";
      })
      .sort((a, b) => (daysRemaining(a.endDate) ?? 99) - (daysRemaining(b.endDate) ?? 99)),
    [members],
  );

  const expired = useMemo(
    () => members
      .filter((m) => {
        const days = daysRemaining(m.endDate);
        return days !== null && days < 0 && m.status !== "cancelled";
      })
      .sort((a, b) => (daysRemaining(b.endDate) ?? -99) - (daysRemaining(a.endDate) ?? -99)),
    [members],
  );

  async function markNotified(id: string) {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markNotified: true }),
      });
      if (res.ok) {
        setNotifiedIds((prev) => new Set(prev).add(id));
        toast.success("Marcado como notificado");
        window.dispatchEvent(new Event("payment-confirmed"));
      } else {
        toast.error("Error al marcar");
      }
    } catch {
      toast.error("Error al marcar");
    }
  }

  const pendingUpcoming = upcoming.filter((m) => !notifiedIds.has(m.id));
  const pendingExpired = expired.filter((m) => !notifiedIds.has(m.id));
  const totalPending = pendingUpcoming.length + pendingExpired.length;

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Notificaciones</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {totalPending > 0
              ? `${totalPending} notificacione${totalPending > 1 ? "s" : ""} pendiente${totalPending > 1 ? "s" : ""}`
              : "Sin notificaciones pendientes"}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          Recargar
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5">
              <div className="h-[18px] w-40 bg-muted rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => <div key={j} className="h-[56px] bg-muted rounded-lg animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : totalPending === 0 ? (
        <div className="bg-card rounded-2xl text-center py-20">
          <CheckCircle className="size-12 mb-4 text-emerald-500 mx-auto" />
          <p className="text-foreground text-lg font-extrabold">Todo al día</p>
          <p className="text-muted-foreground text-sm mt-1">No hay socios por notificar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Próximo a vencer */}
          {pendingUpcoming.length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5 bg-amber-50/50">
                <Clock className="size-[18px] shrink-0" />
                <div>
                  <div className="text-[15px] font-extrabold text-foreground">Próximos a vencer</div>
                  <div className="text-[12px] text-muted-foreground">{pendingUpcoming.length} socio{pendingUpcoming.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {pendingUpcoming.map((m) => {
                  const days = daysRemaining(m.endDate);
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ background: "rgba(245,158,11,.15)", color: "#b45309" }}>
                          {m.name.split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold text-foreground">{m.name}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {membershipLabels[m.membership]} • Vence en {days} día{days !== 1 ? "s" : ""} ({m.endDate ? formatDate(m.endDate) : "-"})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.phone && (
                          <a
                            href={getWhatsAppLink(m.phone, m.name, m.endDate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-bold text-[#25d366] bg-[#25d366]/10 hover:bg-[#25d366]/20 transition"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => markNotified(m.id)}
                          className="px-3 py-2 rounded-[10px] text-[12px] font-bold text-muted-foreground bg-muted hover:bg-muted-foreground/20 transition"
                        >
                          ✓ Hecho
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vencidos */}
          {pendingExpired.length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5 bg-red-50/50">
                <CircleAlert className="size-[18px] shrink-0 text-red-500" />
                <div>
                  <div className="text-[15px] font-extrabold text-foreground">Vencidos</div>
                  <div className="text-[12px] text-muted-foreground">{pendingExpired.length} socio{pendingExpired.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {pendingExpired.map((m) => {
                  const days = Math.abs(daysRemaining(m.endDate) ?? 0);
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ background: "rgba(239,68,68,.12)", color: "#b91c1c" }}>
                          {m.name.split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold text-foreground">{m.name}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {membershipLabels[m.membership]} • Venció hace {days} día{days !== 1 ? "s" : ""} ({m.endDate ? formatDate(m.endDate) : "-"})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.phone && (
                          <a
                            href={getWhatsAppLink(m.phone, m.name, m.endDate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-bold text-[#25d366] bg-[#25d366]/10 hover:bg-[#25d366]/20 transition"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => markNotified(m.id)}
                          className="px-3 py-2 rounded-[10px] text-[12px] font-bold text-muted-foreground bg-muted hover:bg-muted-foreground/20 transition"
                        >
                          ✓ Hecho
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
