"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Smartphone,
  Puzzle,
  Palette,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { applyDashboardTheme } from "@/components/theme-applier";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessPhone: "",
    businessEmail: "",
    address: "",
    legalId: "",
    legalName: "",
    taxPhone: "",
    taxEmail: "",
    district: "",
    canton: "",
    province: "",
    zipCode: "",
    barrio: "",
    invoiceActivity: "",
    sinpePhone: "",
    sinpeName: "",
    colorPrimary: "#1e40af",
    logoUrl: "",
    themePreset: "default",
    bookingNavLabel: "",
    advanceNoticeHours: "2",
    extraClassPrice: "3000",
  });
  const [modules, setModules] = useState<{ key: string; name: string; active: boolean }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function previewTheme(presetKey: string, color: string) {
    applyDashboardTheme(presetKey, color, form.logoUrl);
  }

  function handleLogoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  const themePresets = [
    { key: "default", label: "Default", color: "#1e40af" },
    { key: "ocean", label: "Ocean", color: "#0d9488" },
    { key: "forest", label: "Forest", color: "#16a34a" },
    { key: "sunset", label: "Sunset", color: "#ea580c" },
    { key: "midnight", label: "Midnight", color: "#7c3aed" },
  ];

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          businessName: data.businessName || "",
          businessPhone: data.businessPhone || "",
          businessEmail: data.businessEmail || "",
          address: data.address || "",
          legalId: data.legalId || "",
          legalName: data.legalName || "",
          taxPhone: data.taxPhone || "",
          taxEmail: data.taxEmail || "",
          district: data.district || "",
          canton: data.canton || "",
          province: data.province || "",
          zipCode: data.zipCode || "",
          barrio: data.barrio || "",
          invoiceActivity: data.invoiceActivity || "",
        sinpePhone: data.sinpePhone || "",
        sinpeName: data.sinpeName || "",
        colorPrimary: data.colorPrimary || "#1e40af",
        logoUrl: data.logoUrl || "",
        themePreset: data.themePreset || "default",
        bookingNavLabel: data.bookingNavLabel || "",
        advanceNoticeHours: data.advanceNoticeHours != null ? String(data.advanceNoticeHours) : "2",
        extraClassPrice: data.extraClassPrice != null ? String(data.extraClassPrice) : "3000",
        });
        setModules(data.modules || []);
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, modules }),
      });
      if (res.ok) {
        toast.success("Configuración guardada");
        window.dispatchEvent(new Event("settings-saved"));
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">
          Configuración
        </h1>
      </div>

      {loading ? (
        <div className="bg-card p-6 space-y-4 rounded-2xl max-w-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="w-24 h-3 bg-muted rounded animate-pulse" />
              <div className="w-full h-11 bg-muted rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Información del negocio */}
          <section className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5 bg-muted/30">
              <Building2 className="size-[17px] text-primary" />
              <h2 className="text-[14.5px] font-extrabold text-foreground">Información del negocio</h2>
            </div>
            <div className="p-5 space-y-[14px]">
              <Field label="Nombre del negocio" value={form.businessName} onChange={(v) => set("businessName", v)} />
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Teléfono" value={form.businessPhone} onChange={(v) => set("businessPhone", v)} />
                <Field label="Email" value={form.businessEmail} onChange={(v) => set("businessEmail", v)} type="email" />
              </div>
              <Field label="Dirección" value={form.address} onChange={(v) => set("address", v)} />
            </div>
          </section>

          {/* Factura Electrónica */}
          <section className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5 bg-muted/30">
              <FileText className="size-[17px] text-primary" />
              <h2 className="text-[14.5px] font-extrabold text-foreground">Factura Electrónica (Hacienda CR)</h2>
            </div>
            <div className="p-5 space-y-[14px]">
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Cédula Jurídica / Física" value={form.legalId} onChange={(v) => set("legalId", v)} placeholder="Ej: 3-101-123456" />
                <Field label="Razón Social" value={form.legalName} onChange={(v) => set("legalName", v)} placeholder="Nombre legal de la empresa" />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Teléfono fiscal" value={form.taxPhone} onChange={(v) => set("taxPhone", v)} />
                <Field label="Email fiscal" value={form.taxEmail} onChange={(v) => set("taxEmail", v)} type="email" />
              </div>
              <div className="grid grid-cols-3 gap-[14px]">
                <Field label="Provincia" value={form.province} onChange={(v) => set("province", v)} placeholder="1-7" />
                <Field label="Cantón" value={form.canton} onChange={(v) => set("canton", v)} placeholder="Ej: 01" />
                <Field label="Distrito" value={form.district} onChange={(v) => set("district", v)} placeholder="Ej: 01" />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Barrio" value={form.barrio} onChange={(v) => set("barrio", v)} />
                <Field label="Código Postal" value={form.zipCode} onChange={(v) => set("zipCode", v)} />
              </div>
              <Field label="Actividad Económica" value={form.invoiceActivity} onChange={(v) => set("invoiceActivity", v)} placeholder="Código actividad (ej: 722110)" />
            </div>
          </section>

          {/* SINPE Móvil */}
          <section className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5 bg-muted/30">
              <Smartphone className="size-[17px] text-primary" />
              <h2 className="text-[14.5px] font-extrabold text-foreground">SINPE Móvil</h2>
            </div>
            <div className="p-5 space-y-[14px]">
              <Field label="Número SINPE" value={form.sinpePhone} onChange={(v) => set("sinpePhone", v)} placeholder="+506 8888 8888" />
              <Field label="Nombre en SINPE" value={form.sinpeName} onChange={(v) => set("sinpeName", v)} placeholder="Ej: Gimnasio Fit Jacó" />
            </div>
          </section>

          {/* Módulos */}
          <section className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
            <button
              onClick={() => setModulesOpen(!modulesOpen)}
              className="w-full px-5 py-4 border-b border-border/60 flex items-center justify-between gap-2.5 bg-muted/30 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Puzzle className="size-[17px] text-primary" />
                <h2 className="text-[14.5px] font-extrabold text-foreground">Módulos activos</h2>
              </div>
              {modulesOpen ? (
                <ChevronUp className="size-[16px] text-muted-foreground" />
              ) : (
                <ChevronDown className="size-[16px] text-muted-foreground" />
              )}
            </button>
            {modulesOpen && (
              <div className="p-5 space-y-1">
                {modules.map((mod) => (
                  <label
                    key={mod.key}
                    className="flex items-center justify-between py-2.5 px-1 cursor-pointer group"
                  >
                    <span className="text-[14px] font-semibold text-foreground/80 group-hover:text-foreground transition">
                      {mod.name}
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={mod.active}
                        onChange={() =>
                          setModules((prev) =>
                            prev.map((m) => (m.key === mod.key ? { ...m, active: !m.active } : m))
                          )
                        }
                        className="sr-only"
                        id={`toggle-${mod.key}`}
                      />
                      <label
                        htmlFor={`toggle-${mod.key}`}
                        className={`block w-[42px] h-[24px] rounded-full transition cursor-pointer ${
                          mod.active ? "bg-primary" : "bg-muted-foreground/25"
                        }`}
                      >
                        <span
                          className={`block w-[18px] h-[18px] bg-white rounded-full shadow-sm mt-[3px] transition ${
                            mod.active ? "translate-x-[21px]" : "translate-x-[3px]"
                          }`}
                        />
                      </label>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Apariencia */}
          <section className="bg-card shadow-sm rounded-2xl overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5 bg-muted/30">
              <Palette className="size-[17px] text-primary" />
              <h2 className="text-[14.5px] font-extrabold text-foreground">Apariencia</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Tema de color</label>
                <div className="flex gap-2.5 flex-wrap">
                  {themePresets.map((t) => {
                    const selected = (form.themePreset || "default") === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          set("themePreset", t.key);
                          set("colorPrimary", t.color);
                          previewTheme(t.key, t.color);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border-2 text-[12px] font-bold transition cursor-pointer ${
                          selected ? "border-current shadow-sm" : "border-input hover:border-current"
                        }`}
                        style={{ borderColor: selected ? t.color : undefined, color: t.color }}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ background: t.color }} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">
                  <span className="flex items-center gap-1.5">
                    <Image className="size-[14px]" />
                    Logo
                  </span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-[12px] cursor-pointer transition ${
                    dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-muted-foreground"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleLogoFile(e.target.files[0]); }}
                  />
                  {form.logoUrl ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-card border border-border flex items-center justify-center">
                        <img src={form.logoUrl} alt="logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">Click para cambiar / Arrastrá una imagen</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center">
                        <Image className="size-5 text-muted-foreground" />
                      </div>
                      <span className="text-[12px] text-muted-foreground font-semibold">Arrastrá tu logo aquí</span>
                      <span className="text-[11px] text-muted-foreground">o hacé click para seleccionar</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="Etiqueta del menú de reservas" value={form.bookingNavLabel} onChange={(v) => set("bookingNavLabel", v)} placeholder="Ej: Horario, Citas, Clases" />
              <Field label="Antelación mínima para reservar (horas)" value={form.advanceNoticeHours} onChange={(v) => set("advanceNoticeHours", v)} type="number" placeholder="Ej: 2" />
              <p className="text-[11.5px] text-muted-foreground -mt-1">Cuántas horas antes de la clase los socios deben reservar (0 = sin límite).</p>
              <Field label="Precio clase extra (₡)" value={form.extraClassPrice} onChange={(v) => set("extraClassPrice", v)} type="number" placeholder="Ej: 3000" />
              <p className="text-[11.5px] text-muted-foreground -mt-1">Lo que pagan los socios por reservar una clase por encima de su límite semanal.</p>
            </div>
          </section>

          <div className="pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="w-full sm:w-auto px-7 py-[11px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
      />
    </div>
  );
}
