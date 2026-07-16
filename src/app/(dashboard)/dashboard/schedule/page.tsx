"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import ConfirmModal from "@/components/confirm-modal";
import { fmtTime } from "@/lib/utils";

const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay(); // 0=Sun
  const totalDays = last.getDate();
  const rows: (Date | null)[][] = [];
  let row: (Date | null)[] = [];
  for (let p = 0; p < startPad; p++) row.push(null);
  for (let d = 1; d <= totalDays; d++) {
    row.push(new Date(year, month, d));
    if (row.length === 7) { rows.push(row); row = []; }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); rows.push(row); }
  return rows;
}

function monthLabel(year: number, month: number) {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
}

export default function SchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>(now);
  const [detailDay, setDetailDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  async function handleCancelBooking(id: string) {
    try {
      const res = await fetch(`/api/schedule/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        toast.success("Reserva cancelada");
        load();
      } else {
        toast.error("Error al cancelar");
      }
    } catch {
      toast.error("Error al cancelar");
    }
    setCancelTarget(null);
  }

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const firstVisible = grid[0].find(Boolean) || new Date(year, month, 1);
  const lastVisible = grid[grid.length - 1].filter(Boolean).pop() || new Date(year, month + 1, 0);
  const dateFrom = formatDate(firstVisible);
  const dateTo = formatDate(lastVisible);

  // Build current week (Mon-Sun) containing selectedDay
  const weekDays = useMemo(() => {
    const d = new Date(selectedDay);
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [selectedDay]);

  // Navigate week
  function weekOffset(offset: number) {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + offset * 7);
    setSelectedDay(d);
    if (d.getMonth() !== month) {
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/schedule/slots").then((r) => r.json()),
      fetch(`/api/schedule/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`).then((r) => r.json()),
    ])
      .then(([s, b]) => {
        setSlots(Array.isArray(s) ? s : []);
        setBookings(Array.isArray(b) ? b : []);
      })
      .catch(() => toast.error("Error al cargar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const d = b.date ? new Date(b.date).toISOString().slice(0, 10) : "";
      if (!map[d]) map[d] = [];
      map[d].push(b);
    }
    return map;
  }, [bookings]);

  const selectedDayBookings = (bookingsByDate[formatDate(selectedDay)] || []).sort(
    (a, b) => (a.slot?.startTime || "").localeCompare(b.slot?.startTime || "")
  );
  const detailDayBookings = detailDay ? (bookingsByDate[formatDate(detailDay)] || []).sort(
    (a, b) => (a.slot?.startTime || "").localeCompare(b.slot?.startTime || "")
  ) : [];

  function groupBySlot(bookings: any[]) {
    const groups: Record<string, { startTime: string; endTime: string; bookings: typeof bookings }> = {};
    for (const b of bookings) {
      const key = b.slot?.startTime || "—";
      if (!groups[key]) groups[key] = { startTime: b.slot?.startTime || "—", endTime: b.slot?.endTime || "—", bookings: [] };
      groups[key].bookings.push(b);
    }
    return Object.values(groups).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const selectedDaySlots = groupBySlot(selectedDayBookings);
  const detailDaySlots = groupBySlot(detailDayBookings);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      dayOfWeek: parseInt(fd.get("dayOfWeek") as string),
      startTime: fd.get("startTime"),
      endTime: fd.get("endTime"),
      capacity: parseInt(fd.get("capacity") as string) || 10,
    };
    try {
      const url = editing ? `/api/schedule/slots/${editing.id}` : "/api/schedule/slots";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) {
        toast.success(editing ? "Horario actualizado" : "Horario creado");
        setShowForm(false);
        setEditing(null);
        load();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Horario / Calendario</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {Object.keys(bookingsByDate).length} días con reservas este mes
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo horario
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}
            className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h2 className="text-[17px] font-extrabold text-foreground min-w-[180px] text-center capitalize">{monthLabel(year, month)}</h2>
          <button onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}
            className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(new Date(now)); setDetailDay(null); }}
          className="px-3 py-1.5 rounded-[10px] border border-input bg-background text-[12px] font-bold text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
          Hoy
        </button>
      </div>

      {/* MOBILE: Week strip + list (hidden on md+) */}
      <div className="block md:hidden">
        {loading ? (
          <div className="space-y-3">
            <div className="h-[52px] bg-muted rounded-xl animate-pulse" />
            {[1, 2, 3].map((i) => <div key={i} className="h-[64px] bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => weekOffset(-1)} className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className="text-[13px] font-bold text-foreground">
                {weekDays[0].toLocaleDateString("es-CR", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
              </span>
              <button onClick={() => weekOffset(1)} className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            {/* Week day pills */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4 scrollbar-none">
              {weekDays.map((day) => {
                const ds = formatDate(day);
                const isActive = ds === formatDate(selectedDay);
                const isToday = ds === formatDate(now);
                const dayBookings = bookingsByDate[ds] || [];
                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDay(day)}
                    className={`shrink-0 flex flex-col items-center gap-0.5 py-2.5 px-3.5 rounded-2xl text-center transition cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase">{dayNamesShort[day.getDay()]}</span>
                    <span className={`text-[17px] font-extrabold leading-none ${isToday && !isActive ? "text-primary" : ""}`}>
                      {day.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className={`text-[9px] font-bold ${isActive ? "text-white/80" : "text-primary"}`}>
                        {dayBookings.length} res.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Booking list for selected day */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-[14px] font-extrabold text-foreground">
                  {selectedDay.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <span className="text-[12px] font-bold text-muted-foreground">{selectedDayBookings.length} reservas</span>
              </div>
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p className="font-bold text-sm text-foreground">Sin reservas</p>
                  <p className="text-[12px] mt-1 text-muted-foreground">No hay clientes agendados este día</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedDaySlots.map((slot) => (
                    <div key={slot.startTime} className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {slot.startTime.slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-extrabold text-foreground">{fmtTime(slot.startTime)} — {fmtTime(slot.endTime)}</div>
                          <div className="text-[11px] text-muted-foreground">{slot.bookings.length} persona{slot.bookings.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-[52px]">
                        {slot.bookings.map((b: any) => (
                          <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[12px] font-semibold text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {b.memberName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* View toggle for desktop */}
      <div className="hidden md:flex items-center gap-1.5 mb-3">
        <button onClick={() => setViewMode("month")}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition cursor-pointer ${viewMode === "month" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
          Mes
        </button>
        <button onClick={() => setViewMode("week")}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition cursor-pointer ${viewMode === "week" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
          Semana
        </button>
      </div>

      {/* DESKTOP: Month/Week view (hidden on mobile) */}
      <div className="hidden md:block">
        {viewMode === "week" ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-[64px] bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Week navigation */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <button onClick={() => weekOffset(-1)} className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="text-[14px] font-extrabold text-foreground">
                    {weekDays[0].toLocaleDateString("es-CR", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                  </span>
                  <button onClick={() => weekOffset(1)} className="p-2 rounded-[10px] border border-input bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
                {/* 7-column day grid */}
                <div className="grid grid-cols-7 divide-x divide-border">
                  {weekDays.map((day) => {
                    const ds = formatDate(day);
                    const isToday = ds === formatDate(now);
                    const isActive = ds === formatDate(selectedDay);
                    const dayBookings = bookingsByDate[ds] || [];
                    return (
                      <button key={ds} onClick={() => setSelectedDay(day)}
                        className={`flex flex-col items-center gap-1 py-4 transition cursor-pointer hover:bg-muted ${
                          isActive ? "bg-primary/5" : ""
                        } ${isToday ? "ring-2 ring-inset ring-primary/30" : ""}`}
                      >
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{dayNamesShort[day.getDay()]}</span>
                        <span className={`text-[20px] font-extrabold leading-none ${isToday ? "text-primary" : "text-foreground"}`}>
                          {day.getDate()}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-bold text-primary">{dayBookings.length} res.</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Booking list for selected day */}
                <div className="border-t border-border divide-y divide-border max-h-[380px] overflow-y-auto">
                  {selectedDayBookings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="font-bold text-sm">Sin reservas</p>
                      <p className="text-[12px] mt-1">No hay clientes agendados este día</p>
                    </div>
                  ) : (
                    selectedDaySlots.map((slot) => (
                      <div key={slot.startTime} className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {slot.startTime.slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="text-[14px] font-extrabold text-foreground">{fmtTime(slot.startTime)} — {fmtTime(slot.endTime)}</div>
                            <div className="text-[11px] text-muted-foreground">{slot.bookings.length} persona{slot.bookings.length !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-[52px]">
                          {slot.bookings.map((b: any) => (
                            <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[12px] font-semibold text-foreground group">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              {b.memberName}
                              <button onClick={(e) => { e.stopPropagation(); setCancelTarget(b.id); }}
                                className="ml-0.5 opacity-0 group-hover:opacity-100 size-3.5 rounded-full bg-red-400 text-white flex items-center justify-center hover:bg-red-500 transition cursor-pointer"
                                title="Cancelar reserva">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[80px] bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-7 border-b border-border">
                  {dayNamesShort.map((d) => (
                    <div key={d} className="px-1 py-2 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
                    {week.map((day, di) => {
                      if (!day) return <div key={`e-${di}`} className="min-h-[90px] bg-muted/50" />;
                      const ds = formatDate(day);
                      const dayBookings = bookingsByDate[ds] || [];
                      const isToday = ds === formatDate(now);
                      const isSelected = detailDay && ds === formatDate(detailDay);
                      const isCurrentMonth = day.getMonth() === month;
                      return (
                        <button
                          key={ds}
                          onClick={() => setDetailDay(day)}
                          className={`relative min-h-[90px] p-1 text-left border-r border-border last:border-r-0 transition cursor-pointer hover:bg-muted focus:outline-none ${
                            isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""
                          } ${isToday ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-[2px]">
                            <div className={`text-[12px] font-extrabold leading-tight ${
                              isToday ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"
                            }`}>
                              {day.getDate()}
                            </div>
                            {dayBookings.length > 0 && (
                              <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[8px] font-bold text-white bg-primary rounded-full">
                                {dayBookings.length > 99 ? "99+" : dayBookings.length}
                              </span>
                            )}
                          </div>
                          {dayBookings.length > 0 && (
                            <div className="space-y-[2px] max-h-[58px] overflow-y-auto">
                              {(() => {
                                const slotGroups: Record<string, { startTime: string; count: number }> = {};
                                for (const b of dayBookings) {
                                  const t = b.slot?.startTime?.slice(0, 5) || "—";
                                  if (!slotGroups[t]) slotGroups[t] = { startTime: t, count: 0 };
                                  slotGroups[t].count++;
                                }
                                return Object.values(slotGroups).slice(0, 4).map((sg) => (
                                  <div key={sg.startTime} className="flex items-center gap-[2px] px-1 py-[2px] rounded-[3px] bg-primary/10 text-[9px] font-semibold text-primary leading-tight">
                                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                    <span>{fmtTime(sg.startTime)} {sg.count} pers.</span>
                                  </div>
                                ));
                              })()}
                              {dayBookings.length > 4 && (
                                <div className="text-[8px] font-bold text-primary/60 px-1">+{dayBookings.length - 4} más</div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Desktop: Day detail slide-over */}
        <SlideOver
          open={!!detailDay}
          onClose={() => setDetailDay(null)}
          title={detailDay ? detailDay.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          description={`${detailDayBookings.length} reserva${detailDayBookings.length !== 1 ? "s" : ""}`}
        >
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-3">
              {detailDayBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="font-bold text-base">Sin reservas</p>
                  <p className="text-sm mt-1">No hay clientes agendados este día</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailDaySlots.map((slot) => (
                    <div key={slot.startTime}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="text-[13px] font-extrabold text-foreground">{fmtTime(slot.startTime)} — {fmtTime(slot.endTime)}</div>
                        <div className="text-[11px] font-bold text-muted-foreground">({slot.bookings.length} persona{slot.bookings.length !== 1 ? "s" : ""})</div>
                      </div>
                      <div className="space-y-1.5">
                        {slot.bookings.map((b: any) => (
                          <div key={b.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-muted border border-border group">
                            <div className="w-9 h-9 rounded-[9px] bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {b.memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-bold text-foreground truncate">{b.memberName}</div>
                              {b.memberPhone && <div className="text-[11px] text-muted-foreground">{b.memberPhone}</div>}
                            </div>
                            <button onClick={() => setCancelTarget(b.id)}
                              className="opacity-0 group-hover:opacity-100 shrink-0 size-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition cursor-pointer"
                              title="Cancelar reserva">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SlideOver>
      </div>

      {/* Slot form slide-over */}
      <SlideOver open={showForm} onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? "Editar horario" : "Nuevo horario"}
        description={editing ? `Día ${editing.dayOfWeek} — ${fmtTime(editing.startTime)}` : "Agregá un bloque de horario"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Día de la semana</label>
              <select name="dayOfWeek" defaultValue={editing?.dayOfWeek ?? 0}
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                {dayNamesShort.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Inicio</label>
                <input name="startTime" type="time" defaultValue={editing?.startTime || "06:00"}
                  className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Fin</label>
                <input name="endTime" type="time" defaultValue={editing?.endTime || "07:00"}
                  className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Cupo máximo</label>
              <input name="capacity" type="number" defaultValue={editing?.capacity || 10} min="1"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
              className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear horario"}
            </button>
          </div>
        </form>
      </SlideOver>

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => { if (cancelTarget) handleCancelBooking(cancelTarget); }}
        title="Cancelar reserva"
        message="¿Cancelar esta reserva? El cliente será notificado."
        variant="danger"
      />
    </div>
  );
}
