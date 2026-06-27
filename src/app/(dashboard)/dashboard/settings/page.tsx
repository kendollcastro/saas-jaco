"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    businessName: "",
    businessPhone: "",
    businessEmail: "",
    address: "",
  });
  const [modules, setModules] = useState<
    { key: string; name: string; active: boolean }[]
  >([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            businessName: data.settings.businessName || "",
            businessPhone: data.settings.businessPhone || "",
            businessEmail: data.settings.businessEmail || "",
            address: data.settings.address || "",
          });
        }
        if (data.modules) setModules(data.modules);
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          modules: modules.map((m) => ({ key: m.key, active: m.active })),
        }),
      });
      if (res.ok) {
        toast.success("Configuración guardada");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-[jacoFade_0.25s_ease]">
        <h1 className="text-[21px] font-extrabold tracking-tight text-[#0f172a] mb-6">
          Configuración
        </h1>
        <div className="bg-white border border-[#e8ecf2] rounded-2xl shadow-[0_1px_2px_rgba(16,26,54,.03)] max-w-lg p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[42px] bg-gray-100 rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <h1 className="text-[21px] font-extrabold tracking-tight text-[#0f172a] mb-6">
        Configuración
      </h1>
      <div className="bg-white border border-[#e8ecf2] rounded-2xl shadow-[0_1px_2px_rgba(16,26,54,.03)] max-w-lg">
        <div className="px-6 pt-5 pb-4 border-b border-[#eef2f6]">
          <div className="text-[15.5px] font-extrabold text-[#0f172a]">
            Información del negocio
          </div>
        </div>
        <div className="p-6 space-y-[16px]">
          <div>
            <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
              Nombre del negocio
            </label>
            <input
              value={settings.businessName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, businessName: e.target.value }))
              }
              placeholder="Mi negocio en Jacó"
              className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
              Teléfono
            </label>
            <input
              value={settings.businessPhone}
              onChange={(e) =>
                setSettings((s) => ({ ...s, businessPhone: e.target.value }))
              }
              placeholder="+506 8888 8888"
              className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
              Email
            </label>
            <input
              type="email"
              value={settings.businessEmail}
              onChange={(e) =>
                setSettings((s) => ({ ...s, businessEmail: e.target.value }))
              }
              placeholder="info@mnegocio.com"
              className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
              Dirección
            </label>
            <input
              value={settings.address}
              onChange={(e) =>
                setSettings((s) => ({ ...s, address: e.target.value }))
              }
              placeholder="Jacó, Costa Rica"
              className="w-full px-[13px] py-[11px] border border-[#e2e8f0] rounded-[10px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
            />
          </div>

          <hr className="border-[#e8ecf2]" />

          <h3 className="font-extrabold text-sm text-[#0f172a]">
            Módulos activos
          </h3>
          <div className="space-y-3">
            {modules.map((mod) => (
              <label
                key={mod.key}
                className="flex items-center gap-2.5 text-[14px] font-semibold text-[#475569] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={mod.active}
                  onChange={() =>
                    setModules((prev) =>
                      prev.map((m) =>
                        m.key === mod.key ? { ...m, active: !m.active } : m
                      )
                    )
                  }
                  className="w-[15px] h-[15px] accent-[#1e40af] cursor-pointer"
                />
                {mod.name}
              </label>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-[11px] border-none rounded-[11px] text-[14px] font-bold font-sans bg-[#1e40af] text-white cursor-pointer shadow-[0_2px_6px_rgba(30,64,175,.32)] hover:bg-[#1e40af]/90 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
