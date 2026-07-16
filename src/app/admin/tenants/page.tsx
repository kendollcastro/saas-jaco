"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Search, ArrowRight, Users, Calendar, Dumbbell, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then(setTenants)
      .catch(() => { setError(true); toast.error("Error al cargar tenants"); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTenants = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <h1 className="text-[21px] font-extrabold tracking-tight text-foreground mb-6">Tenants</h1>

      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tenant..."
          className="w-full pl-9 pr-4 py-2.5 border border-input rounded-[10px] text-[14px] text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[66px] bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <AlertCircle className="size-10 mx-auto mb-3 text-destructive" />
          <p className="text-[14px] font-semibold text-muted-foreground">Error al cargar tenants</p>
          <button
            onClick={() => { setError(false); setLoading(true); fetch("/api/admin/tenants").then(r => r.json()).then(setTenants).catch(() => setError(true)).finally(() => setLoading(false)); }}
            className="mt-4 text-[13px] font-bold text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border">
          <Building2 className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-[14px] font-semibold text-muted-foreground">{search ? "Sin resultados" : "No hay tenants"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageTenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center justify-between bg-card rounded-xl px-5 py-3.5 border border-border hover:border-primary/30 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${t.active ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-foreground truncate flex items-center gap-2">
                      {t.name}
                      {!t.active && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Suspendido</span>}
                    </div>
                    <div className="text-[12px] text-muted-foreground">{t.email}</div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Users className="size-[14px]" /> {t.users}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Calendar className="size-[14px]" /> {t.bookings}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Dumbbell className="size-[14px]" /> {t.members}
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {t.activeModules.map((m: any) => (
                      <span key={m.key} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{m.name}</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t.plan}</span>
                  <ArrowRight className="size-[15px] text-muted-foreground/40" />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-[13px]">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronLeft className="size-[15px]" /> Anterior
              </button>
              <span className="text-muted-foreground">
                Página {page + 1} de {totalPages} ({filtered.length} total)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                Siguiente <ChevronRight className="size-[15px]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
