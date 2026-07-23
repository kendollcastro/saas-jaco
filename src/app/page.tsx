"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

/* ── Reusable animation wrappers ── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Feature cards ── */
const features = [
  {
    title: "Reservas",
    desc: "Calendario inteligente con capacidad por horario. El cliente reserva solo, vos lo administrás.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Socios & Membresías",
    desc: "Control de membresías, vencimientos, check-in con QR y pagos desde el portal del socio.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: "Cobros & Links de Pago",
    desc: "Generá un link de pago y enviálo por WhatsApp. El socio paga desde su celular y sube el comprobante.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "Inventario & POS",
    desc: "Control de stock, ventas con escáner de código de barras y caja registradora integrada.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    title: "Portal del Socio",
    desc: "Cada socio tiene su propio portal con QR, historial de pagos y reservas desde el celular.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    title: "Reportes",
    desc: "Gráficos de ingresos, reservas y membresías. Exportá todo a CSV para tu contador.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="relative bg-[#f8f9fc] dark:bg-[#0c0e14] text-[#1a1d29] dark:text-[#e8eaef] font-sans overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
        ::selection { background: #3b82f6; color: white; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9fc]/70 dark:bg-[#0c0e14]/70 backdrop-blur-xl border-b border-[#e2e6ee]/50 dark:border-[#1f2330]/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#1e40af] to-[#3b82f6] bg-clip-text text-transparent">
            Ola<span className="text-[#1a1d29] dark:text-[#e8eaef]">SaaS</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#1a1d29]/70 dark:text-[#e8eaef]/70 hover:text-[#1a1d29] dark:hover:text-[#e8eaef] transition px-4 py-2 rounded-xl hover:bg-[#e2e6ee]/50 dark:hover:bg-[#1f2330]/50 no-underline">
              Iniciar sesión
            </Link>
            <Link href="/register"
              className="text-sm font-bold text-white bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-[#1e40af]/25 transition-all no-underline">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/5 dark:bg-[#3b82f6]/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/5 dark:bg-[#8b5cf6]/8 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
              Hecho para crecer con tu negocio
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]"
          >
            <span className="bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              Gestioná tu
            </span>
            <br />
            <span className="text-[#1a1d29] dark:text-[#e8eaef]">
              negocio en{" "}
              <span className="relative">
                un <span className="underline decoration-[#3b82f6]/30 decoration-4 underline-offset-8">click</span>
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-lg sm:text-xl text-[#1a1d29]/60 dark:text-[#e8eaef]/50 max-w-2xl mx-auto leading-relaxed"
          >
            La plataforma modular para gimnasios, tour operadores, clínicas y restaurantes.
            <br className="hidden sm:block" />
            Reservas, membresías, inventario, facturación y más — todo en un solo lugar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#1e40af] to-[#3b82f6] hover:shadow-xl hover:shadow-[#1e40af]/25 hover:-translate-y-0.5 transition-all no-underline">
              Comenzar gratis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-0.5 transition">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/login"
              className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-semibold border border-[#e2e6ee] dark:border-[#1f2330] hover:bg-[#e2e6ee]/50 dark:hover:bg-[#1f2330]/50 transition-all no-underline text-[#1a1d29] dark:text-[#e8eaef]">
              Iniciar sesión
            </Link>
          </motion.div>

          {/* Floating decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex items-center justify-center gap-6 pt-8 text-xs text-[#1a1d29]/40 dark:text-[#e8eaef]/30"
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Sin tarjeta de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              7 días gratis
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Soporte en español
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative px-6 pb-32 pt-8">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
                Todo lo que necesitás
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Modular. Simple. Potente.
              </h2>
              <p className="text-[#1a1d29]/50 dark:text-[#e8eaef]/40 max-w-xl mx-auto">
                Activá solo los módulos que tu negocio necesita. Sin pagar de más por lo que no usás.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <ScaleIn key={f.title} delay={i * 0.08}>
                <div className="group relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#12151f] border border-[#e2e6ee] dark:border-[#1f2330] hover:border-[#3b82f6]/20 hover:shadow-xl hover:shadow-[#3b82f6]/5 transition-all duration-300">
                  <div className="w-11 h-11 rounded-2xl bg-[#3b82f6]/10 dark:bg-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6] mb-5 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-extrabold mb-2">{f.title}</h3>
                  <p className="text-sm text-[#1a1d29]/50 dark:text-[#e8eaef]/40 leading-relaxed">{f.desc}</p>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
                En 3 pasos
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Empezar nunca fue tan fácil
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Creá tu cuenta", desc: "Registrate en 30 segundos. No pedimos tarjeta de crédito." },
              { step: "02", title: "Configurá tu negocio", desc: "Activá los módulos que necesitás, cargá tus servicios o productos." },
              { step: "03", title: "Empezá a operar", desc: "Tus socios ya pueden reservar, pagar y acceder a su portal." },
            ].map((s, i) => (
              <ScaleIn key={s.step} delay={i * 0.15}>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e40af] to-[#3b82f6] flex items-center justify-center mx-auto text-white text-xl font-extrabold shadow-lg shadow-[#1e40af]/20">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-extrabold">{s.title}</h3>
                  <p className="text-sm text-[#1a1d29]/50 dark:text-[#e8eaef]/40 max-w-xs mx-auto">{s.desc}</p>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <ScaleIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#8b5cf6] p-10 sm:p-16 text-center text-white shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
              <div className="relative space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  ¿Listo para digitalizar tu negocio?
                </h2>
                <p className="text-white/70 max-w-md mx-auto">
                  Empezá hoy con 7 días gratis. Sin compromiso, sin tarjeta.
                </p>
                <Link href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-[#1e40af] bg-white hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg no-underline">
                  Crear cuenta gratis
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#e2e6ee] dark:border-[#1f2330] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight">
            Ola<span className="text-[#1a1d29]/40 dark:text-[#e8eaef]/40">SaaS</span>
          </span>
          <p className="text-xs text-[#1a1d29]/30 dark:text-[#e8eaef]/20">
            © {new Date().getFullYear()} OlaSaaS. Costa Rica.
          </p>
        </div>
      </footer>
    </div>
  );
}
