"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      router.push("/dashboard/bookings");
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nueva reserva</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente</label>
          <input
            name="customerName"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="customerPhone"
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="customerEmail"
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
          <input
            name="serviceName"
            required
            placeholder="Ej: Clase de surf, Tour ATV, Pesca"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              name="date"
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input
              name="time"
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personas</label>
            <input
              name="pax"
              type="number"
              min="1"
              defaultValue="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total (₡)</label>
            <input
              name="total"
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depósito (₡)</label>
            <input
              name="deposit"
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Crear reserva"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
