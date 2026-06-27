"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SlideOver from "@/components/slide-over";

export default function BookingsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<never[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      customerName: form.get("customerName"),
      customerPhone: form.get("customerPhone"),
      customerEmail: form.get("customerEmail"),
      serviceName: form.get("serviceName"),
      date: form.get("date"),
      time: form.get("time"),
      pax: Number(form.get("pax")),
      total: Number(form.get("total")),
      deposit: Number(form.get("deposit")),
      notes: form.get("notes"),
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowForm(false);
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-[#0f172a]">
          Reservas
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-[#1e40af] text-white border-none rounded-[11px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva reserva
        </button>
      </div>

      <div className="bg-white border border-[#e8ecf2] rounded-2xl shadow-[0_1px_2px_rgba(16,26,54,.03)] overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-bold text-base">No hay reservas aún</p>
            <p className="text-sm mt-1 mb-4">
              Crea la primera reserva para empezar
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#1e40af] text-white border-none rounded-[11px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva reserva
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-[#fafbfc]">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Servicio</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Fecha</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Personas</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>{bookings.map(() => null)}</tbody>
            </table>
          </div>
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
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Nombre del cliente
              </label>
              <input
                name="customerName"
                required
                placeholder="Ej. Carlos Jiménez"
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Teléfono
                </label>
                <input
                  name="customerPhone"
                  type="tel"
                  placeholder="+506 8888 8888"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Email
                </label>
                <input
                  name="customerEmail"
                  type="email"
                  placeholder="correo@mail.com"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Servicio
              </label>
              <input
                name="serviceName"
                required
                placeholder="Ej: Clase de surf, Tour ATV, Pesca"
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Fecha
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Hora
                </label>
                <input
                  name="time"
                  type="time"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Número de personas
              </label>
              <input
                name="pax"
                type="number"
                min="1"
                defaultValue="1"
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Total (₡)
                </label>
                <input
                  name="total"
                  type="number"
                  placeholder="90000"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Depósito (₡)
                </label>
                <input
                  name="deposit"
                  type="number"
                  placeholder="30000"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-[#eef2f6] shrink-0">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-[12px] border border-[#e2e8f0] rounded-[11px] text-[14px] font-bold font-sans bg-white text-[#475569] cursor-pointer hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-[12px] border-none rounded-[11px] text-[14px] font-bold font-sans bg-[#1e40af] text-white cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear reserva"}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
