"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tent, Users, Clock, Dumbbell, Check, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";

const STEPS = [
  { key: "services", title: "Servicios", icon: Tent, desc: "¿Qué servicios ofrecés?" },
  { key: "staff", title: "Staff", icon: Users, desc: "Agregá tus instructores" },
  { key: "schedule", title: "Horario", icon: Clock, desc: "Configurá tus horarios" },
  { key: "members", title: "Socios", icon: Dumbbell, desc: "Invitá a tus primeros socios" },
];

interface Props {
  progress: { services: boolean; staff: boolean; schedule: boolean; members: boolean };
  onComplete: () => void;
}

export default function OnboardingWizard({ progress, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [stepData, setStepData] = useState<any>({
    services: [{ name: "", duration: 60, price: "" }],
    staff: [{ name: "", phone: "", email: "" }],
    schedule: { days: [] as string[], startTime: "07:00", endTime: "17:00", slotMinutes: 60 },
    members: [{ name: "", phone: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPct = ((completedCount + (step > completedCount ? step - completedCount : 0)) / 4) * 100;

  function updateStep(key: string, idx: number | null, field: string, value: any) {
    setStepData((prev: any) => {
      const copy = { ...prev };
      if (idx !== null) {
        const items = [...copy[key]];
        items[idx] = { ...items[idx], [field]: value };
        copy[key] = items;
      } else {
        copy[key] = { ...copy[key], [field]: value };
      }
      return copy;
    });
  }

  function addItem(key: string) {
    setStepData((prev: any) => {
      const copy = { ...prev };
      const empty = key === "services" ? { name: "", duration: 60, price: "" }
        : key === "staff" ? { name: "", phone: "", email: "" }
        : { name: "", phone: "" };
      copy[key] = [...copy[key], empty];
      return copy;
    });
  }

  function removeItem(key: string, idx: number) {
    setStepData((prev: any) => {
      const copy = { ...prev };
      copy[key] = copy[key].filter((_: any, i: number) => i !== idx);
      return copy;
    });
  }

  const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  async function saveAndNext() {
    if (step === 3) {
      // Members step — just skip, no need to create from wizard
      setStep(4);
      return;
    }

    setSaving(true);
    try {
      const data = stepData[STEPS[step].key];

      if (step === 0) {
        // Create services
        const valid = data.filter((s: any) => s.name.trim());
        for (const s of valid) {
          await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: s.name, duration: Number(s.duration), price: Number(s.price) || 0 }),
          });
        }
      }

      if (step === 1) {
        // Create staff
        const valid = data.filter((s: any) => s.name.trim());
        for (const s of valid) {
          await fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: s.name, phone: s.phone, email: s.email }),
          });
        }
      }

      if (step === 2) {
        // Create schedule slots
        for (const day of data.days) {
          await fetch("/api/schedule/slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dayOfWeek: Number(day),
              startTime: data.startTime,
              endTime: data.endTime,
              slotMinutes: Number(data.slotMinutes),
            }),
          });
        }
      }

      if (step < 3) {
        setStep((s) => s + 1);
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/onboarding", { method: "POST" });
      setDone(true);
      setTimeout(onComplete, 1200);
    } catch {
      toast.error("Error al finalizar");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl shadow-2xl border border-border p-10 text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="size-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2">¡Todo listo!</h2>
          <p className="text-[14px] text-muted-foreground">Tu negocio está configurado. Empezá a gestionar desde el panel.</p>
        </motion.div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl shadow-2xl border border-border p-10 text-center max-w-sm"
        >
          <Sparkles className="size-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-foreground mb-2">Casi listo</h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            Podés agregar socios desde el panel de Socios cuando tengas sus datos. 
            Por ahora terminemos la configuración.
          </p>
          <button
            onClick={finish}
            disabled={saving}
            className="w-full py-3 rounded-[12px] bg-primary text-primary-foreground text-[14px] font-bold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Finalizando..." : "Ir al panel"}
          </button>
        </motion.div>
      </div>
    );
  }

  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              key={step}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center"
            >
              <s.icon className="size-[20px] text-primary" />
            </motion.div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">{s.title}</h2>
              <p className="text-[13px] text-muted-foreground">{s.desc}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="text-[11px] font-bold text-muted-foreground mt-1.5 text-right">
            Paso {step + 1} de 4
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-2 max-h-[50vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {step === 0 && (
                <>
                  <p className="text-[13px] text-muted-foreground mb-2">Creá al menos un servicio para empezar.</p>
                  {stepData.services.map((svc: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-muted/20 rounded-xl p-3">
                      <div className="flex-1 space-y-2">
                        <input
                          value={svc.name}
                          onChange={(e) => updateStep("services", i, "name", e.target.value)}
                          placeholder="Nombre del servicio"
                          className="w-full px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={svc.duration}
                            onChange={(e) => updateStep("services", i, "duration", e.target.value)}
                            placeholder="Minutos"
                            className="w-24 px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                          <input
                            type="number"
                            value={svc.price}
                            onChange={(e) => updateStep("services", i, "price", e.target.value)}
                            placeholder="Precio ₡"
                            className="flex-1 px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      {stepData.services.length > 1 && (
                        <button
                          onClick={() => removeItem("services", i)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-500 pt-2"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem("services")}
                    className="text-[12px] font-bold text-primary hover:underline"
                  >
                    + Agregar otro servicio
                  </button>
                </>
              )}

              {step === 1 && (
                <>
                  <p className="text-[13px] text-muted-foreground mb-2">Agregá las personas que trabajan en tu negocio.</p>
                  {stepData.staff.map((st: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-muted/20 rounded-xl p-3">
                      <div className="flex-1 space-y-2">
                        <input
                          value={st.name}
                          onChange={(e) => updateStep("staff", i, "name", e.target.value)}
                          placeholder="Nombre completo"
                          className="w-full px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <input
                            value={st.phone}
                            onChange={(e) => updateStep("staff", i, "phone", e.target.value)}
                            placeholder="Teléfono"
                            className="flex-1 px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                          <input
                            value={st.email}
                            onChange={(e) => updateStep("staff", i, "email", e.target.value)}
                            placeholder="Email"
                            className="flex-1 px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      {stepData.staff.length > 1 && (
                        <button
                          onClick={() => removeItem("staff", i)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-500 pt-2"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem("staff")}
                    className="text-[12px] font-bold text-primary hover:underline"
                  >
                    + Agregar otra persona
                  </button>
                </>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-[13px] text-muted-foreground">Seleccioná los días que trabajás y el horario.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d, i) => {
                      const selected = stepData.schedule.days.includes(String(i));
                      return (
                        <button
                          key={i}
                          onClick={() => updateStep("schedule", null, "days",
                            selected
                              ? stepData.schedule.days.filter((x: string) => x !== String(i))
                              : [...stepData.schedule.days, String(i)]
                          )}
                          className={`px-3 py-2 rounded-[8px] text-[12px] font-bold border transition ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-input text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Inicio</label>
                      <input
                        type="time"
                        value={stepData.schedule.startTime}
                        onChange={(e) => updateStep("schedule", null, "startTime", e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Fin</label>
                      <input
                        type="time"
                        value={stepData.schedule.endTime}
                        onChange={(e) => updateStep("schedule", null, "endTime", e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary mt-1"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[11px] font-bold text-muted-foreground">Duración</label>
                      <input
                        type="number"
                        value={stepData.schedule.slotMinutes}
                        onChange={(e) => updateStep("schedule", null, "slotMinutes", e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-[8px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary mt-1"
                        placeholder="min"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-4">
                  <Dumbbell className="size-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] text-muted-foreground">
                    Más adelante podés agregar socios desde el panel. 
                    Cada socio recibe un PIN para acceder al Portal y gestionar sus propias reservas y pagos.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep((s) => s - 1) : null}
            disabled={step === 0}
            className="flex items-center gap-1 text-[13px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
          >
            <ArrowLeft className="size-[15px]" />
            Atrás
          </button>

          <button
            onClick={saveAndNext}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Siguiente"}
            <ChevronRight className="size-[15px]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
