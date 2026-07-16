"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, storeMember } from "@/lib/portal-client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/portal/settings${slug ? `?slug=${slug}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setSettings(d); if (d.colorPrimary) { document.documentElement.style.setProperty("--portal-primary", d.colorPrimary); } })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setToken(data.token);
      storeMember(data.member);
      router.push("/portal/dashboard");
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-[#f4f6f9] via-[#f4f6f9] to-[#1e40af]/10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.businessName} className="h-16 mx-auto mb-4 object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#1e40af]/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <h1 className="text-[24px] font-extrabold text-[#0f172a]">{settings?.businessName || "Portal de Socios"}</h1>
          <p className="text-[13px] text-[#64748b] mt-1">Iniciá sesión con tu teléfono y PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border border-[#e8ecf2]/50 shadow-2xl rounded-3xl p-7 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#64748b] mb-1.5">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+506 8888 8888"
              className="w-full px-4 py-3.5 border border-[#e2e8f0] rounded-xl text-[14px] text-[#0f172a] bg-white placeholder:text-[#94a3b8]/50 focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 transition" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#64748b] mb-1.5">PIN de 4 dígitos</label>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} type="password" maxLength={6} placeholder="••••"
              className="w-full px-4 py-3.5 border border-[#e2e8f0] rounded-xl text-[14px] text-[#0f172a] bg-white placeholder:text-[#94a3b8]/50 focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 transition text-center tracking-[8px]" />
          </div>
          {error && <p className="text-[12px] text-red-600 font-semibold">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white cursor-pointer shadow-xl shadow-[#1e40af]/25 hover:shadow-[#1e40af]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-[12px] text-[#64748b]">
            ¿No tenés cuenta?{" "}
            <Link href="/portal/register" className="text-[#1e40af] font-bold hover:underline">Registrate</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
