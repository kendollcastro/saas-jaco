"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { fmtTime } from "@/lib/utils";

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatTime(t: string) {
  return fmtTime(t);
}

export default function PublicSchedulePage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"form" | "done">("form");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const weekDates = useMemo(() => getWeekDates(), []);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/schedule-slots").then((r) => r.json()).catch(() => []),
      fetch("/api/public/schedule-bookings").then((r) => r.json()).catch(() => []),
    ])
      .then(([s, b]) => {
        setSlots(Array.isArray(s) ? s : []);
        setBookings(Array.isArray(b) ? b : []);
      })
      .catch(() => toast.error("Error al cargar horarios"))
      .finally(() => setLoading(false));
  }, []);

  const slotsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (let d = 0; d < 7; d++) {
      map[d] = slots
        .filter((s) => s.dayOfWeek === d && s.active)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [slots]);

  const bookingsBySlot = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookings) {
      if (b.status === "confirmed") {
        const key = `${b.slotId}_${b.date?.slice(0, 10)}`;
        map[key] = (map[key] || 0) + 1;
      }
    }
    return map;
  }, [bookings]);

  async function handleBook() {
    if (!selectedSlot || selectedDay === null || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const date = weekDates[selectedDay];
      const res = await fetch("/api/public/schedule-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          memberName: form.name.trim(),
          memberPhone: form.phone.trim() || null,
          date: date.toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al reservar");
      }
    } catch {
      toast.error("Error al reservar");
    } finally {
      setSubmitting(false);
    }
  }

  const hasSlots = Object.values(slotsByDay).some((s) => s.length > 0);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1e40af] flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="9" r="3.4" />
              <path d="M3 19c2.5-3 6-4.5 9-4.5s6.5 1.5 9 4.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a]">Reservá tu horario</h1>
          <p className="text-sm text-[#64748b] mt-1">Elegí el día y horario que quieras asistir esta semana</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : !hasSlots ? (
          <div className="text-center py-20 text-[#94a3b8] bg-white rounded-2xl border border-[#e8ecf2]">
            <div className="text-5xl mb-4">📅</div>
            <p className="font-bold text-base">No hay horarios disponibles</p>
            <p className="text-sm mt-1">Volvé pronto para reservar</p>
          </div>
        ) : step === "done" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-[#e8ecf2]"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-extrabold text-[#0f172a]">Reserva confirmada</h2>
            <p className="text-[#64748b] mt-2">
              {selectedSlot && (
                <>Te esperamos el <strong>{dayNames[selectedDay!]}</strong> a las <strong>{formatTime(selectedSlot.startTime)}</strong></>
              )}
            </p>
            <button
              onClick={() => { setStep("form"); setSelectedSlot(null); setSelectedDay(null); setForm({ name: "", phone: "" }); }}
              className="mt-6 px-6 py-3 bg-[#1e40af] text-white rounded-[11px] text-sm font-bold border-none cursor-pointer hover:bg-[#1e40af]/90 transition"
            >
              Reservar otro
            </button>
          </motion.div>
        ) : (
          <>
            {/* Day selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const hasSlotsOnDay = slotsByDay[i]?.length > 0;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDay(i);
                      setSelectedSlot(null);
                      if (!hasSlotsOnDay) toast.error("Sin horarios ese día");
                    }}
                    className={`flex flex-col items-center px-4 py-3 rounded-xl text-sm font-bold border transition shrink-0 cursor-pointer ${
                      selectedDay === i
                        ? "bg-[#1e40af] text-white border-[#1e40af]"
                        : "bg-white text-[#475569] border-[#e2e8f0] hover:border-[#1e40af]"
                    } ${isToday ? "ring-2 ring-[#1e40af]/30" : ""}`}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-70">{dayNamesShort[i]}</span>
                    <span className="text-lg">{d.getDate()}</span>
                    {hasSlotsOnDay && <span className="w-1.5 h-1.5 rounded-full bg-current mt-1" />}
                  </button>
                );
              })}
            </div>

            {/* Form + Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: form */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-[#e8ecf2] rounded-2xl p-5 space-y-4 sticky top-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#475569] mb-1.5">Tu nombre</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-[10px] text-sm font-sans text-[#0f172a] bg-white focus:outline-none focus:border-[#1e40af] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#475569] mb-1.5">Teléfono (opcional)</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+506 8888 8888"
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-[10px] text-sm font-sans text-[#0f172a] bg-white focus:outline-none focus:border-[#1e40af] transition"
                    />
                  </div>
                  {selectedSlot && selectedDay !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#1e40af]/5 rounded-xl p-4"
                    >
                      <p className="text-sm text-[#475569]">
                        <strong>{dayNames[selectedDay]}</strong> a las <strong>{formatTime(selectedSlot.startTime)}</strong>
                      </p>
                      <button
                        onClick={handleBook}
                        disabled={!form.name.trim() || submitting}
                        className="mt-3 w-full py-3 bg-[#1e40af] text-white rounded-[11px] text-sm font-bold border-none cursor-pointer hover:bg-[#1e40af]/90 transition disabled:opacity-50"
                      >
                        {submitting ? "Reservando..." : "Confirmar reserva"}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right: slots */}
              <div className="lg:col-span-3 space-y-3">
                {selectedDay !== null && slotsByDay[selectedDay]?.length > 0 ? (
                  slotsByDay[selectedDay].map((slot: any) => {
                    const dateKey = weekDates[selectedDay].toISOString().slice(0, 10);
                    const booked = bookingsBySlot[`${slot.id}_${dateKey}`] || 0;
                    const remaining = slot.capacity - booked;
                    const full = remaining <= 0;
                    return (
                      <motion.button
                        key={slot.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={!full ? { scale: 1.01 } : {}}
                        onClick={() => !full && setSelectedSlot(slot)}
                        disabled={full}
                        className={`w-full text-left px-5 py-4 rounded-xl border transition cursor-pointer ${
                          selectedSlot?.id === slot.id
                            ? "bg-[#1e40af] text-white border-[#1e40af]"
                            : full
                            ? "bg-gray-50 text-[#94a3b8] border-[#e2e8f0] cursor-not-allowed"
                            : "bg-white text-[#0f172a] border-[#e2e8f0] hover:border-[#1e40af]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-sm font-bold ${
                              selectedSlot?.id === slot.id
                                ? "bg-white/20"
                                : "bg-[#1e40af]/10 text-[#1e40af]"
                            }`}>
                              {formatTime(slot.startTime)}
                            </div>
                            <div>
                              <div className="font-bold text-[14px]">{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</div>
                              <div className="text-[11px] opacity-70">{remaining} cupo{remaining !== 1 ? "s" : ""} disponible{remaining !== 1 ? "s" : ""}</div>
                            </div>
                          </div>
                          {full && <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">LLENO</span>}
                        </div>
                      </motion.button>
                    );
                  })
                ) : selectedDay !== null ? (
                  <div className="text-center py-12 text-[#94a3b8] bg-white rounded-2xl border border-[#e8ecf2]">
                    <p className="font-semibold">Sin horarios este día</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#94a3b8] bg-white rounded-2xl border border-[#e8ecf2]">
                    <p className="font-semibold">Seleccioná un día para ver horarios</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
