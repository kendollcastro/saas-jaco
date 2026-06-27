"use client";

import { useState } from "react";
import SlideOver from "@/components/slide-over";

export default function StaffPage() {
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        role: form.get("role"),
      }),
    });
    if (res.ok) {
      setShowForm(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-[#0f172a]">
          Staff
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-[#1e40af] text-white border-none rounded-[11px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar instructor
        </button>
      </div>

      <div className="bg-white border border-[#e8ecf2] rounded-2xl shadow-[0_1px_2px_rgba(16,26,54,.03)] overflow-hidden">
        <div className="text-center py-16 text-[#94a3b8]">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-bold text-base">No hay personal registrado</p>
          <p className="text-sm mt-1">Agrega instructores, guías y staff</p>
        </div>
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
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Nombre completo
              </label>
              <input
                name="name"
                required
                placeholder="Ej. Diego Mora"
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Teléfono
                </label>
                <input
                  name="phone"
                  placeholder="+506 8888 8888"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="staff@email.com"
                  className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Rol
              </label>
              <select
                name="role"
                className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-semibold font-sans text-[#0f172a] bg-white cursor-pointer focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              >
                <option value="">Seleccionar rol</option>
                <option value="instructor">Instructor</option>
                <option value="guide">Guía</option>
                <option value="driver">Chofer</option>
                <option value="admin">Administrativo</option>
              </select>
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
              className="flex-[2] py-[12px] border-none rounded-[11px] text-[14px] font-bold font-sans bg-[#1e40af] text-white cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition"
            >
              Guardar miembro
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
