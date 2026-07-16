"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, storeMember } from "@/lib/portal-client";
import Link from "next/link";
const memberships = [
  { key: "mensual", label: "Mensual", months: 1 },
  { key: "trimestral", label: "Trimestral", months: 3 },
  { key: "semestral", label: "Semestral", months: 6 },
  { key: "anual", label: "Anual", months: 12 },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [form, setForm] = useState({ name: "", phone: "", email: "", pin: "", confirmPin: "", membership: "mensual" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.pin !== form.confirmPin) { setError("Los PIN no coinciden"); return; }
    if (form.pin.length < 4) { setError("El PIN debe tener al menos 4 dígitos"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, pin: form.pin, membership: form.membership, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setToken(data.token);
      storeMember(data.member);
      setSuccess(data);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-5 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]" />
      </div>

        {success ? (
          <div
            className="relative w-full max-w-sm"
          >
            <div
              className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 shadow-2xl rounded-3xl p-8 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-[20px] font-extrabold text-foreground">Registro exitoso</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Bienvenido, {success.member.name}!</p>
              </div>
              {success.sinpe && (
                <div className="bg-muted/50 rounded-2xl p-5 border border-border text-left space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Datos para pagar</p>
                  <p className="text-[15px] font-bold text-foreground">SINPE Móvil: {success.sinpe.phone}</p>
                  {success.sinpe.name && <p className="text-[13px] text-muted-foreground">A nombre de: {success.sinpe.name}</p>}
                  <p className="text-[11px] text-muted-foreground mt-2">Pagá y subí el comprobante desde tu panel</p>
                </div>
              )}
              <div className="space-y-2.5">
                <button onClick={() => router.push("/portal/payments")}
                  className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all">
                  Subir comprobante de pago
                </button>
                <button onClick={() => router.push("/portal/dashboard")}
                  className="w-full py-3.5 border border-border rounded-xl text-[14px] font-bold bg-background text-foreground cursor-pointer hover:bg-muted transition-all">
                  Ir al panel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full max-w-sm"
          >
            <div className="text-center mb-8">
              <h1 className="text-[24px] font-extrabold text-foreground">Crear cuenta</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Registrate como socio</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 shadow-2xl rounded-3xl p-7 space-y-3.5"
            >
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Nombre completo</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required
                  className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Teléfono</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+506 8888 8888"
                  className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Email (opcional)</label>
                <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email"
                  className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Tipo membresía</label>
                <div className="grid grid-cols-2 gap-2">
                  {memberships.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => set("membership", m.key)}
                      className={`py-3 px-3 rounded-xl text-[13px] font-bold border-2 transition cursor-pointer ${
                        form.membership === m.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">PIN de 4 dígitos</label>
                <input value={form.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} type="password" maxLength={6} required placeholder="••••"
                  className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-center tracking-[8px]" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Confirmar PIN</label>
                <input value={form.confirmPin} onChange={(e) => set("confirmPin", e.target.value.replace(/\D/g, "").slice(0, 6))} type="password" maxLength={6} required placeholder="••••"
                  className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-center tracking-[8px]" />
              </div>
              {error && (
                <p className="text-[12px] text-destructive font-semibold">
                  {error}
                </p>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
              <p className="text-center text-[12px] text-muted-foreground">
                ¿Ya tenés cuenta?{" "}
                <Link href="/portal/login" className="text-primary font-bold hover:underline">Iniciar sesión</Link>
              </p>
            </form>
          </div>
        )}
    </div>
  );
}
