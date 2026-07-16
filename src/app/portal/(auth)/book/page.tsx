"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/portal-client";
import { fmtTime } from "@/lib/utils";
const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function BookPage() {
  const router = useRouter();
  const token = getToken();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { router.replace("/portal/login"); return; }
    fetch("/api/portal/slots")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSlots(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router]);

  const daySlots = useMemo(() =>
    slots.filter((s) => s.dayOfWeek === selectedDay && s.active).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, selectedDay]
  );

  const getNextDateForDay = (dayOfWeek: number) => {
    const d = new Date();
    const diff = dayOfWeek - d.getDay();
    if (diff < 0) d.setDate(d.getDate() + diff + 7);
    else if (diff > 0) d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  };

  function selectDay(day: number) {
    setSelectedDay(day);
    setSelectedSlot(null);
    setBookingDate(getNextDateForDay(day));
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-portal-token": token || "" },
        body: JSON.stringify({ slotId: selectedSlot, date: bookingDate }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  }

  if (!token) return null;

  if (done) {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <div
          className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 shadow-2xl rounded-3xl p-8 text-center space-y-5 mt-8"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-[20px] font-extrabold text-foreground">Reserva confirmada!</h2>
          <p className="text-[13px] text-muted-foreground">
            Te esperamos el {new Date(bookingDate).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <button onClick={() => router.push("/portal/dashboard")}
            className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 max-w-lg mx-auto space-y-4"
    >
      <div>
        <h1 className="text-[20px] font-extrabold text-foreground">Reservar horario</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Elegí el día y horario que querés</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {dayNames.map((name, i) => {
          const isActive = selectedDay === i;
          const isToday = new Date().getDay() === i;
          return (
            <button
              key={i}
              onClick={() => selectDay(i)}
              className={`shrink-0 px-4 py-3 rounded-2xl text-[12px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-xl shadow-primary/25"
                  : "backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {isToday ? "Hoy " : ""}{name.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Date */}
      <div>
        <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Fecha</label>
        <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
          className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
      </div>

      {/* Slots */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i}
              className="h-[64px] bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : daySlots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-bold text-sm text-foreground">Sin horarios disponibles</p>
          <p className="text-[12px] mt-1">No hay horarios configurados para este día</p>
        </div>
      ) : (
          <div
            key={selectedDay}
            className="space-y-2"
          >
            {daySlots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-card/50 dark:bg-card/30 hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-primary/20">
                    {fmtTime(slot.startTime).replace(" ", "\n")}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold text-foreground">
                      {fmtTime(slot.startTime)} — {fmtTime(slot.endTime)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Cupo: {slot.capacity}</div>
                  </div>
                  {isSelected && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" />
                        <polyline points="16 8 10 14 8 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                  )}
                </button>
              );
            })}
          </div>
      )}

      {error && (
        <p className="text-[12px] text-destructive font-semibold">
          {error}
        </p>
      )}

      <button
        onClick={handleBook}
        disabled={!selectedSlot || submitting}
        className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Reservando..." : "Confirmar reserva"}
      </button>
    </div>
  );
}
