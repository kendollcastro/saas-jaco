"use client";

import { useState } from "react";

export default function ServicesPage() {
  const [services, setServices] = useState<{ id: string; name: string; price: number | null; duration: number | null }[]>([]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + Nuevo servicio
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await fetch("/api/services", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.get("name"),
                price: Number(form.get("price")),
                duration: Number(form.get("duration")),
              }),
            });
            setShowForm(false);
          }}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-3 max-w-md"
        >
          <input
            name="name"
            placeholder="Nombre del servicio"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="price"
              type="number"
              placeholder="Precio (₡)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              name="duration"
              type="number"
              placeholder="Duración (min)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🏄</div>
            <p className="font-medium">No hay servicios aún</p>
            <p className="text-sm mt-1">Agrega los servicios que ofreces (clases de surf, tours, etc.)</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Precio</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Duración</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.price ? `₡${s.price.toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3">{s.duration ? `${s.duration} min` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
