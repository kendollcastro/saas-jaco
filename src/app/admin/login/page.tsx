"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.target as HTMLFormElement);
    const formEmail = (form.get("email") as string) || email;
    const formPassword = (form.get("password") as string) || password;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email: formEmail, password: formPassword });

    if (authError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // Check if super_admin
    const res = await fetch("/api/me");
    if (res.ok) {
      const data = await res.json();
      if (data.role === "super_admin") {
        router.push("/admin");
        router.refresh();
        return;
      }
    }

    setError("No tienes acceso de administrador");
    await supabase.auth.signOut();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-[12px] bg-primary flex items-center justify-center mb-4">
              <Shield className="size-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Admin</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Acceso al panel de control</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
                placeholder="admin@email.com"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Contraseña</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[12px] font-semibold text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[11px] border-none rounded-[10px] text-[14px] font-bold bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-[12px] font-bold text-muted-foreground hover:text-primary transition">
              Ir al login del negocio →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
