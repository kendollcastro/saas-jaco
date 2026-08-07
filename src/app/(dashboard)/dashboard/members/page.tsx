"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import SlideOver from "@/components/slide-over";
import { formatPhone, waPhone } from "@/lib/phone";
import { Clock, Dumbbell, Tag } from "lucide-react";
import { fmtStoredDate, daysUntilStoredDate, todayLocalDateOnly } from "@/lib/utils";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(d: string) {
  return fmtStoredDate(d, months);
}

function daysRemaining(endDate: string | null): number | null {
  return daysUntilStoredDate(endDate);
}

function getMemberStatus(m: any): { key: string; label: string; bg: string; color: string } {
  if (m.status === "cancelled") return { key: "cancelled", label: "Cancelado", bg: "#f1f5f9", color: "#64748b" };
  if (m.status === "pending") return { key: "pending", label: "Pendiente", bg: "#fef3c7", color: "#b45309" };
  const days = daysRemaining(m.endDate);
  if (days === null || days < 0) return { key: "expired", label: "Vencido", bg: "#fee2e2", color: "#b91c1c" };
  if (days <= 7) return { key: "expiring", label: `Vence en ${days}d`, bg: "#fef3c7", color: "#b45309" };
  return { key: "active", label: "Activo", bg: "#dcfce7", color: "#15803d" };
}

function getWhatsAppLink(phone: string, memberName: string, endDate: string | null) {
  const cleaned = waPhone(phone);
  const days = daysRemaining(endDate);
  let text = "";
  if (days !== null && days <= 7 && days >= 0) {
    text = `Hola ${memberName}, 🏋️ Te recordamos que tu membresía vence el ${endDate ? formatDate(endDate) : "pronto"}. ¡Renueva y sigue entrenando! 💪`;
  } else if (days !== null && days < 0) {
    text = `Hola ${memberName}, 🙌 Tu membresía está vencida. ¡Renueva hoy y vuelve al gym! 💪`;
  } else {
    text = `Hola ${memberName}, 👋 ¿Cómo estás?`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

const membershipLabels: Record<string, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const tabs = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "active", label: "Activos" },
  { key: "expiring", label: "Próximo a vencer" },
  { key: "expired", label: "Vencidos" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [statusTab, setStatusTab] = useState("all");
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
      setSelectedIds(new Set(paginatedData.map((m) => m.id)));
    }
  }

  async function batchRenew() {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Renovar ${selectedIds.size} socio${selectedIds.size !== 1 ? "s" : ""} por 1 mes?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/members/${id}/renew`, { method: "POST" });
    }
    toast.success(`${selectedIds.size} socio${selectedIds.size !== 1 ? "s" : ""} renovado${selectedIds.size !== 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    window.dispatchEvent(new Event("payment-confirmed"));
    load();
  }

  function batchWhatsApp() {
    if (selectedIds.size === 0) return;
    const selected = paginatedData.filter((m) => selectedIds.has(m.id) && m.phone);
    if (selected.length === 0) { toast.error("Ninguno tiene teléfono"); return; }
    selected.forEach((m) => window.open(getWhatsAppLink(m.phone, m.name, m.endDate), "_blank"));
  }

  async function batchCancel() {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Cancelar membresía de ${selectedIds.size} socio${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    }
    toast.success("Membresías canceladas");
    setSelectedIds(new Set());
    load();
  }

  const membersWithStatus = useMemo(() => members.map((m) => ({ ...m, _status: getMemberStatus(m) })), [members]);

  const expiringSoon = useMemo(() =>
    membersWithStatus.filter((m) => m._status.key === "expiring"),
  [membersWithStatus]);

  const filtered = useMemo(() => {
    let list = membersWithStatus;
    if (statusTab !== "all") list = list.filter((m) => m._status.key === statusTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone?.includes(q));
    }
    return list;
  }, [membersWithStatus, statusTab, search]);

  const paginatedData = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/membership-plans").then((r) => r.json()),
    ])
      .then(([m, p]) => {
        setMembers(Array.isArray(m) ? m : []);
        setPlans(Array.isArray(p) ? p : []);
      })
      .catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [search, statusTab]);

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const rawPlan = fd.get("planId") as string;
    const isLegacy = ["mensual", "trimestral", "semestral", "anual"].includes(rawPlan);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          planId: isLegacy ? null : (rawPlan || null),
          membership: isLegacy ? rawPlan : "personalizado",
          startDate: fd.get("startDate"),
          amount: fd.get("amount"),
          paymentMethod: fd.get("paymentMethod"),
          notes: fd.get("notes"),
          birthDate: fd.get("birthDate"),
          gender: fd.get("gender"),
          weightKg: fd.get("weightKg"),
          heightCm: fd.get("heightCm"),
          emergencyContact: fd.get("emergencyContact"),
          emergencyPhone: fd.get("emergencyPhone"),
          medicalConditions: fd.get("medicalConditions"),
          objective: fd.get("objective"),
        }),
      });
      if (res.ok) {
        toast.success("Socio registrado");
        setShowForm(false);
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear socio");
      }
    } catch {
      toast.error("Error al crear socio");
    } finally {
      setSubmitting(false);
    }
  }

  async function registerPayment(memberId: string, amount: number) {
    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/members/${memberId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "efectivo", notes: "Pago registrado" }),
      });
      if (res.ok) {
        toast.success("Pago registrado");
        load();
        const data = await res.json();
        setSelectedMember(data);
      } else {
        toast.error("Error al registrar pago");
      }
    } catch {
      toast.error("Error al registrar pago");
    } finally {
      setPaySubmitting(false);
    }
  }

  function calcAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - b.getUTCFullYear();
    const m = now.getMonth() - b.getUTCMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) age--;
    return age;
  }

  function calcBmi(weightKg: number | null, heightCm: number | null): number | null {
    if (!weightKg || !heightCm) return null;
    const h = heightCm / 100;
    return Math.round((weightKg / (h * h)) * 10) / 10;
  }

  function defaultRenewalAmount(m: any): number {
    if (m?.plan?.price) return m.plan.price;
    if (m.membership === "mensual") return 25000;
    if (m.membership === "trimestral") return 65000;
    if (m.membership === "semestral") return 120000;
    if (m.membership === "anual") return 220000;
    return 25000;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember) return;
    const fd = new FormData(e.currentTarget);
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: fd.get("birthDate"),
          gender: fd.get("gender"),
          weightKg: fd.get("weightKg"),
          heightCm: fd.get("heightCm"),
          emergencyContact: fd.get("emergencyContact"),
          emergencyPhone: fd.get("emergencyPhone"),
          medicalConditions: fd.get("medicalConditions"),
          objective: fd.get("objective"),
        }),
      });
      if (res.ok) {
        toast.success("Datos actualizados");
        const data = await res.json();
        setSelectedMember(data);
        setEditingProfile(false);
        load();
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Socios</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/members/plans"
            className="inline-flex items-center gap-1.5 px-3.5 py-[11px] rounded-[10px] border border-border text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition"
          >
            <Tag className="size-[15px]" />
            Planes
          </Link>
          <button
            id="create-member-btn"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo socio
          </button>
        </div>
      </div>

      {/* Alert banner for expiring soon */}
      {expiringSoon.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="size-[18px] text-amber-600 shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-amber-800">
              {expiringSoon.length} socio{expiringSoon.length > 1 ? "s" : ""} próximo{expiringSoon.length > 1 ? "s" : ""} a vencer
            </p>
            <p className="text-[12px] text-amber-700 truncate">
              {expiringSoon.map((m) => m.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-[10px] p-[3px]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition cursor-pointer ${
                statusTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Search */}
        {members.length > 0 && (
          <div className="relative flex-1 max-w-[220px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar socio..."
              className="w-full pl-8 pr-3 py-[7px] border border-input rounded-[8px] text-[12px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
            />
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
            <Dumbbell className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">{search || statusTab !== "all" ? "Sin resultados" : "No hay socios aún"}</p>
            <p className="text-sm mt-1 mb-4">Registrá el primer socio para empezar a gestionar membresías</p>
            {!search && statusTab === "all" && (
              <button
                onClick={() => { const btn = document.getElementById("create-member-btn"); if (btn) btn.click(); }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Registrar socio
              </button>
            )}
          </div>
        ) : (
          <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
              <span className="text-[13px] font-bold text-foreground">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}</span>
              <div className="flex gap-1.5 ml-auto">
                <button onClick={batchRenew} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-bold border-none cursor-pointer hover:bg-primary/90 transition">
                  Renovar 1 mes
                </button>
                <button onClick={batchWhatsApp} className="px-3 py-1.5 rounded-lg bg-[#25d366] text-white text-[12px] font-bold border-none cursor-pointer hover:bg-[#25d366]/90 transition">
                  WhatsApp
                </button>
                <button onClick={batchCancel} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold border-none cursor-pointer hover:bg-red-600 transition">
                  Cancelar
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground cursor-pointer hover:bg-muted transition">
                  Limpiar
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="w-[40px] px-3 py-3">
                    <input type="checkbox" checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                      onChange={toggleSelectAll}
                      className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                  </th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Membresía</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vence</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">WhatsApp</th>
                  <th className="w-[60px] px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((m) => {
                  const st = m._status;
                  return (
                    <tr key={m.id} className={`border-t border-border ${selectedIds.has(m.id) ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)}
                          className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                      </td>
                      <td
                        className="px-3 py-3 cursor-pointer"
                        onClick={() => { setSelectedMember(m); setDetailOpen(true); }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-xs flex-shrink-0 bg-primary/10 text-primary">
                            {m.name.split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <div className="text-[13.5px] font-bold text-foreground">{m.name}</div>
                            <div className="text-[11.5px] text-muted-foreground">{formatPhone(m.phone) || m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[13.5px] font-semibold text-muted-foreground">
                        {membershipLabels[m.membership] || m.membership}
                      </td>
                      <td className="px-3 py-3 text-[13.5px] text-muted-foreground">
                        {m.endDate ? formatDate(m.endDate) : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-[11px] py-[4px] rounded-full text-xs font-bold"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {m.phone && (
                          <a
                            href={getWhatsAppLink(m.phone, m.name, m.endDate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold text-[#25d366] hover:bg-[#25d366]/10 transition"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Enviar WhatsApp
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => { setSelectedMember(m); setDetailOpen(true); }}
                          className="text-muted-foreground hover:text-primary transition p-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
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

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title="Nuevo socio" description="Registra un nuevo cliente">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre</label>
              <input name="name" required placeholder="Nombre completo" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Teléfono</label>
                <input name="phone" placeholder="+50688888888" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Email</label>
                <input name="email" type="email" placeholder="correo@mail.com" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Plan de membresía</label>
                <select name="planId" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="">Seleccionar plan...</option>
                  {plans.filter((p) => p.active).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₡{p.price.toLocaleString("es-CR")} / {p.durationDays}d
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="mensual">Mensual (legacy)</option>
                  <option value="trimestral">Trimestral (legacy)</option>
                  <option value="semestral">Semestral (legacy)</option>
                  <option value="anual">Anual (legacy)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Inicio</label>
                <input name="startDate" type="date" defaultValue={todayLocalDateOnly()} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <hr className="border-border" />
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Monto pagado (₡)</label>
                <input name="amount" type="number" placeholder="25000" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Método de pago</label>
                <select name="paymentMethod" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="efectivo">Efectivo</option>
                  <option value="sinpe">SINPE Móvil</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Notas</label>
              <textarea name="notes" rows={2} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none" placeholder="Notas opcionales..." />
            </div>
            <hr className="border-border" />
            <div className="flex items-center gap-2">
              <Dumbbell className="size-4 text-muted-foreground" />
              <span className="text-[12.5px] font-extrabold text-foreground uppercase tracking-wide">Datos físicos y salud</span>
              <span className="text-[11px] font-semibold text-muted-foreground">(opcional)</span>
            </div>
            <div className="grid grid-cols-3 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Fecha nacimiento</label>
                <input name="birthDate" type="date" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Sexo</label>
                <select name="gender" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="">—</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Objetivo</label>
                <select name="objective" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="">—</option>
                  <option value="Perder peso">Perder peso</option>
                  <option value="Ganar músculo">Ganar músculo</option>
                  <option value="Mejorar condición">Mejorar condición</option>
                  <option value="Salud general">Salud general</option>
                  <option value="Rehabilitación">Rehabilitación</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Peso (kg)</label>
                <input name="weightKg" type="number" inputMode="decimal" step="0.1" min="0" placeholder="70.5" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Altura (cm)</label>
                <input name="heightCm" type="number" inputMode="decimal" step="0.1" min="0" placeholder="170" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Contacto emergencia</label>
                <input name="emergencyContact" placeholder="Nombre y relación" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Tel. emergencia</label>
                <input name="emergencyPhone" type="tel" placeholder="+50688888888" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Condiciones médicas / lesiones</label>
              <textarea name="medicalConditions" rows={2} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none" placeholder="Alergias, lesiones, condiciones..." />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : "Registrar socio"}
            </button>
          </div>
        </form>
      </SlideOver>

      <SlideOver
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedMember(null); setEditingProfile(false); }}
        title={selectedMember?.name || ""}
        description="Detalle del socio"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-4">
            {selectedMember && (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Teléfono</span>
                    <span className="text-[14px] text-muted-foreground">{selectedMember.phone || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Email</span>
                    <span className="text-[14px] text-muted-foreground">{selectedMember.email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Membresía</span>
                    <span className="text-[14px] font-bold text-foreground">
                      {selectedMember.plan ? selectedMember.plan.name : (membershipLabels[selectedMember.membership] || selectedMember.membership)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Vence</span>
                    <span className="text-[14px] text-muted-foreground">{selectedMember.endDate ? formatDate(selectedMember.endDate) : "-"}</span>
                  </div>
                </div>

                {/* WhatsApp + Cobrar buttons */}
                {selectedMember.phone && (
                  <div className="flex gap-2">
                    <a
                      href={getWhatsAppLink(selectedMember.phone, selectedMember.name, selectedMember.endDate)}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25d366]/10 text-[#25d366] rounded-[10px] text-[13px] font-bold hover:bg-[#25d366]/20 transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                    <CobrarButton memberId={selectedMember.id} name={selectedMember.name} phone={selectedMember.phone} />
                  </div>
                )}

                {/* Datos personales / perfil */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-muted-foreground" />
                      <span className="text-[12px] font-extrabold text-foreground uppercase tracking-wide">Datos personales</span>
                    </div>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {editingProfile ? (
                    <form onSubmit={saveProfile} className="p-4 space-y-[14px]">
                      <div className="grid grid-cols-3 gap-[12px]">
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Fecha nacimiento</label>
                          <input name="birthDate" type="date" defaultValue={selectedMember.birthDate ? new Date(selectedMember.birthDate).toISOString().slice(0, 10) : ""} className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Sexo</label>
                          <select name="gender" defaultValue={selectedMember.gender || ""} className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                            <option value="">—</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Objetivo</label>
                          <select name="objective" defaultValue={selectedMember.objective || ""} className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                            <option value="">—</option>
                            <option value="Perder peso">Perder peso</option>
                            <option value="Ganar músculo">Ganar músculo</option>
                            <option value="Mejorar condición">Mejorar condición</option>
                            <option value="Salud general">Salud general</option>
                            <option value="Rehabilitación">Rehabilitación</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-[12px]">
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Peso (kg)</label>
                          <input name="weightKg" type="number" inputMode="decimal" step="0.1" min="0" defaultValue={selectedMember.weightKg ?? ""} className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Altura (cm)</label>
                          <input name="heightCm" type="number" inputMode="decimal" step="0.1" min="0" defaultValue={selectedMember.heightCm ?? ""} className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-[12px]">
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Contacto emergencia</label>
                          <input name="emergencyContact" defaultValue={selectedMember.emergencyContact || ""} placeholder="Nombre y relación" className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Tel. emergencia</label>
                          <input name="emergencyPhone" type="tel" defaultValue={selectedMember.emergencyPhone || ""} placeholder="+50688888888" className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-bold text-muted-foreground mb-[5px]">Condiciones médicas / lesiones</label>
                        <textarea name="medicalConditions" rows={2} defaultValue={selectedMember.medicalConditions || ""} placeholder="Alergias, lesiones, condiciones..." className="w-full px-[11px] py-[9px] border border-input rounded-[9px] text-[13px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProfile(false)}
                          className="px-4 py-2 rounded-[9px] border border-input text-[12.5px] font-bold text-muted-foreground bg-background cursor-pointer hover:bg-muted/50 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-4 py-2 rounded-[9px] border-none text-[12.5px] font-bold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition disabled:opacity-50"
                        >
                          {profileSaving ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Cumpleaños</span>
                          <span className="text-[13.5px] text-foreground">
                            {selectedMember.birthDate ? `${formatDate(selectedMember.birthDate)} (${calcAge(selectedMember.birthDate)} años)` : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Sexo</span>
                          <span className="text-[13.5px] capitalize text-foreground">{selectedMember.gender ? selectedMember.gender : "-"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Peso</span>
                          <span className="text-[13.5px] text-foreground">{selectedMember.weightKg ? `${selectedMember.weightKg} kg` : "-"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Altura</span>
                          <span className="text-[13.5px] text-foreground">{selectedMember.heightCm ? `${selectedMember.heightCm} cm` : "-"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">IMC</span>
                          <span className="text-[13.5px] text-foreground">
                            {calcBmi(selectedMember.weightKg, selectedMember.heightCm) !== null ? `${calcBmi(selectedMember.weightKg, selectedMember.heightCm)}` : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Objetivo</span>
                          <span className="text-[13.5px] text-foreground">{selectedMember.objective || "-"}</span>
                        </div>
                      </div>
                      {(selectedMember.emergencyContact || selectedMember.emergencyPhone) && (
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Contacto emergencia</span>
                          <span className="text-[13.5px] text-foreground">
                            {[selectedMember.emergencyContact, selectedMember.emergencyPhone && formatPhone(selectedMember.emergencyPhone)].filter(Boolean).join(" · ") || "-"}
                          </span>
                        </div>
                      )}
                      {selectedMember.medicalConditions && (
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Condiciones médicas</span>
                          <span className="text-[13.5px] text-foreground">{selectedMember.medicalConditions}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Renewal section */}
                {/* Pending confirmation section */}
                {(selectedMember._status?.key === "pending") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-[13px] font-extrabold text-amber-800 mb-2">
                      Pendiente de confirmación
                    </div>
                    {selectedMember.payments?.[0]?.receiptUrl && (
                      <div className="mb-3">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Comprobante</span>
                        <img
                          src={selectedMember.payments[0].receiptUrl}
                          alt="Comprobante de pago"
                          className="max-h-[200px] rounded-lg border border-amber-200 cursor-pointer"
                          onClick={() => window.open(selectedMember.payments[0].receiptUrl, "_blank")}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue={defaultRenewalAmount(selectedMember)}
                        className="flex-1 px-3 py-2 border border-amber-300 rounded-[10px] text-[13px] font-sans text-foreground bg-background focus:outline-none focus:border-amber-500"
                        placeholder="Monto"
                        id="confirm-amount"
                      />
                      <select
                        id="confirm-method"
                        className="w-[110px] px-2 py-2 border border-amber-300 rounded-[10px] text-[12px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-amber-500"
                        defaultValue="sinpe"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="sinpe">SINPE</option>
                        <option value="transferencia">Transf.</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                      <button
                        onClick={async () => {
                          const amount = (document.getElementById("confirm-amount") as HTMLInputElement).value;
                          const method = (document.getElementById("confirm-method") as HTMLSelectElement).value;
                          if (!amount) { toast.error("Indica el monto"); return; }
                          setPaySubmitting(true);
                          try {
                            const res = await fetch(`/api/members/${selectedMember.id}/payments`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ amount: parseFloat(amount), method, notes: "Confirmación registro portal" }),
                            });
                            if (res.ok) {
                              toast.success("Pago confirmado — membresía activada");
                              window.dispatchEvent(new Event("payment-confirmed"));
                              load();
                              const data = await res.json();
                              setSelectedMember(data);
                            } else {
                              toast.error("Error al confirmar");
                            }
                          } catch {
                            toast.error("Error al confirmar");
                          } finally {
                            setPaySubmitting(false);
                          }
                        }}
                        disabled={paySubmitting}
                        className="px-4 py-2 bg-amber-600 text-white rounded-[10px] text-[12px] font-bold border-none cursor-pointer hover:bg-amber-700 transition disabled:opacity-50 shrink-0"
                      >
                        {paySubmitting ? "..." : "Confirmar pago"}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedMember._status?.key === "expiring" || selectedMember._status?.key === "expired") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-[13px] font-extrabold text-amber-800 mb-2">
                      {selectedMember._status.key === "expired" ? "Membresía vencida" : "Próximo a vencer"}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue={defaultRenewalAmount(selectedMember)}
                        className="flex-1 px-3 py-2 border border-amber-300 rounded-[10px] text-[13px] font-sans text-foreground bg-background focus:outline-none focus:border-amber-500"
                        placeholder="Monto"
                        id="renewal-amount"
                      />
                      <select
                        id="renewal-method"
                        className="w-[110px] px-2 py-2 border border-amber-300 rounded-[10px] text-[12px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-amber-500"
                        defaultValue="efectivo"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="sinpe">SINPE</option>
                        <option value="transferencia">Transf.</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                      <button
                        onClick={async () => {
                          const amount = (document.getElementById("renewal-amount") as HTMLInputElement).value;
                          const method = (document.getElementById("renewal-method") as HTMLSelectElement).value;
                          if (!amount) { toast.error("Indica el monto"); return; }
                          setPaySubmitting(true);
                          try {
                            const res = await fetch(`/api/members/${selectedMember.id}/payments`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ amount: parseFloat(amount), method, notes: "Renovación" }),
                            });
                            if (res.ok) {
                              toast.success("Membresía renovada");
                              load();
                              const data = await res.json();
                              setSelectedMember(data);
                            } else {
                              toast.error("Error al renovar");
                            }
                          } catch {
                            toast.error("Error al renovar");
                          } finally {
                            setPaySubmitting(false);
                          }
                        }}
                        disabled={paySubmitting}
                        className="px-4 py-2 bg-amber-600 text-white rounded-[10px] text-[12px] font-bold border-none cursor-pointer hover:bg-amber-700 transition disabled:opacity-50 shrink-0"
                      >
                        {paySubmitting ? "..." : "Renovar"}
                      </button>
                    </div>
                  </div>
                )}

                {selectedMember.notes && (
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notas</span>
                    <p className="text-[13px] text-muted-foreground bg-muted rounded-[10px] p-3">{selectedMember.notes}</p>
                  </div>
                )}

                <hr className="border-border" />

                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">Historial de pagos</span>
                  {selectedMember.payments?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Sin pagos registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMember.payments?.map((p: any) => (
                        <div key={p.id} className="bg-muted rounded-[10px] p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[13px] font-bold text-foreground">₡{p.amount.toLocaleString("de-DE")}</div>
                              <div className="text-[11px] text-muted-foreground">{p.method} • {formatDate(p.createdAt)}</div>
                            </div>
                            {p.sinpeRef && <div className="text-[11px] text-muted-foreground">Ref: {p.sinpeRef}</div>}
                          </div>
                          {p.receiptUrl && (
                            <img
                              src={p.receiptUrl}
                              alt="Comprobante"
                              className="mt-2 max-h-[120px] rounded-lg border border-border cursor-pointer"
                              onClick={() => window.open(p.receiptUrl, "_blank")}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </SlideOver>
    </div>
  );
}

function CobrarButton({ memberId, name, phone }: { memberId: string; name: string; phone: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);

  async function handleGenerate() {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount: parseFloat(amount), concept: concept || "Pago de membresía" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResult(data);
      navigator.clipboard.writeText(data.url).catch(() => {});
      const cleaned = phone.replace(/[^0-9]/g, "");
      const waMsg = `Hola ${name}, 👋 te envié este link para que puedas pagar: ${data.url}`;
      window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(waMsg)}`, "_blank");
    } catch { toast.error("Error al generar link"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-[10px] text-[13px] font-bold hover:bg-primary/20 transition cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v20M2 12h20" />
        </svg>
        Cobrar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => { setOpen(false); setResult(null); }}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-extrabold text-foreground">Cobrar a {name}</h3>
            {result ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-center">
                  <p className="text-sm font-bold text-emerald-600">Link generado</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{result.url}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(result.url); toast.success("Link copiado"); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition">
                  Copiar link
                </button>
                <button onClick={() => { setOpen(false); setResult(null); }}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer">
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Monto (CRC)</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    type="text" inputMode="decimal" placeholder="25000"
                    className="w-full px-3.5 py-2.5 border border-input rounded-xl text-sm font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Concepto (opcional)</label>
                  <input value={concept} onChange={(e) => setConcept(e.target.value)}
                    placeholder="Pago de membresía"
                    className="w-full px-3.5 py-2.5 border border-input rounded-xl text-sm font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
                </div>
                <button onClick={handleGenerate} disabled={loading || !amount}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50">
                  {loading ? "Generando..." : "Generar link y enviar WhatsApp"}
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
