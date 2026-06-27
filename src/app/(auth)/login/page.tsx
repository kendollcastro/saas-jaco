"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex w-full h-screen">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-1 bg-[#101a36] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-[-90px] right-[-70px] w-[300px] h-[300px] rounded-full bg-[rgba(147,180,247,.14)]" />
        <div className="absolute bottom-[-120px] left-[-80px] w-[320px] h-[320px] rounded-full bg-[rgba(255,255,255,.05)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-xl bg-[#1e40af] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="9" r="3.4" />
                <path d="M3 19c2.5-3 6-4.5 9-4.5s6.5 1.5 9 4.5" />
              </svg>
            </div>
            <div className="text-[19px] font-extrabold text-white tracking-tight">
              Jacó<span className="text-[#93b4f7]"> SaaS</span>
            </div>
          </div>
        </div>
        <div className="relative max-w-[380px]">
          <div className="text-[34px] font-extrabold leading-tight tracking-tight text-white">
            Gestiona tus reservas en la costa del Pacífico.
          </div>
          <div className="text-[15px] leading-relaxed text-white/60 mt-[18px]">
            Clases de surf, tours ATV, pesca y canopy — todo tu negocio turístico en Jacó, organizado en un solo lugar.
          </div>
        </div>
        <div className="relative text-[12.5px] text-white/40">
          &copy; 2026 Jacó SaaS &middot; Hecho en Costa Rica 🇨🇷
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-[28px_22px] md:p-10 bg-[#f4f6f9]">
        <div className="w-full max-w-[380px] animate-[jacoUp_0.4s_ease]">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-[11px] mb-[26px]">
            <div className="w-[40px] h-[40px] rounded-[11px] bg-[#1e40af] flex items-center justify-center">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="9" r="3.4" />
                <path d="M3 19c2.5-3 6-4.5 9-4.5s6.5 1.5 9 4.5" />
              </svg>
            </div>
            <div className="text-[17px] font-extrabold text-[#0f172a]">
              Jacó<span className="text-[#1e40af]"> SaaS</span>
            </div>
          </div>

          <div className="text-[25px] font-extrabold tracking-tight text-[#0f172a]">
            Bienvenido de nuevo
          </div>
          <div className="text-[14px] text-[#64748b] mt-[6px] mb-[26px]">
            Inicia sesión para gestionar tus reservas.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@negocio.cr"
                required
                className="w-full px-[14px] py-[12px] border border-[#e2e8f0] rounded-[11px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#475569] mb-[7px]">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-[14px] py-[12px] border border-[#e2e8f0] rounded-[11px] text-[14px] font-sans text-[#0f172a] bg-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1e40af] focus:shadow-[0_0_0_3px_rgba(30,64,175,.13)] transition"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[#475569] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  className="w-[15px] h-[15px] accent-[#1e40af] cursor-pointer"
                />
                Recordarme
              </label>
              <span className="text-[13px] font-bold text-[#1e40af] cursor-pointer">
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[13px] border-none rounded-[11px] text-[15px] font-bold font-sans bg-[#1e40af] text-white cursor-pointer shadow-[0_2px_8px_rgba(30,64,175,.34)] hover:bg-[#1e40af]/90 transition disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="text-center text-[12.5px] text-[#94a3b8] mt-4">
            Demo — usa cualquier correo y contraseña para entrar.
          </div>

          <p className="text-center text-[#94a3b8] text-[12.5px] mt-[26px]">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[#1e40af] font-bold hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
