"use client";

import { useState } from "react";

export default function StaffPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + Agregar instructor
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await fetch("/api/staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.get("name"),
                phone: form.get("phone"),
                email: form.get("email"),
                role: form.get("role"),
              }),
            });
            setShowForm(false);
          }}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-3 max-w-md"
        >
          <input
            name="name"
            placeholder="Nombre completo"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="phone"
              placeholder="Teléfono"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <select
            name="role"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Seleccionar rol</option>
            <option value="instructor">Instructor</option>
            <option value="guide">Guía</option>
            <option value="driver">Chofer</option>
            <option value="admin">Administrativo</option>
          </select>
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
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <p className="font-medium">No hay personal registrado</p>
          <p className="text-sm mt-1">Agrega instructores, guías y staff</p>
        </div>
      </div>
    </div>
  );
}
