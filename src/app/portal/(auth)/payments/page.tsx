"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/portal-client";


export default function PaymentsPage() {
  const router = useRouter();
  const token = getToken();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("sinpe");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { router.replace("/portal/login"); return; }
    fetch("/api/portal/payments", { headers: { "x-portal-token": token } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPayments(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router]);

  function handleReceiptFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Solo imágenes"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setReceiptDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) { setError("Indicá el monto"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-portal-token": token || "" },
        body: JSON.stringify({ amount: parseFloat(amount), method, receiptUrl: receiptDataUrl || null, paidAt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  }

  if (!token) return null;

  if (done) {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <div
          className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 shadow-2xl rounded-3xl p-8 text-center space-y-5 mt-8"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-[20px] font-extrabold text-foreground">Pago reportado</h2>
          <p className="text-[13px] text-muted-foreground">El administrador va a confirmar tu pago pronto</p>
          <button onClick={() => router.push("/portal/dashboard")}
            className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 max-w-lg mx-auto space-y-4"
    >
      <div>
        <h1 className="text-[20px] font-extrabold text-foreground">Pagos</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Reportá tu pago y subí el comprobante</p>
      </div>

      {/* New payment form */}
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg space-y-3.5"
      >
        <h2 className="text-[15px] font-extrabold text-foreground">Nuevo pago</h2>

        <div>
          <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Monto pagado (CRC)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} type="text" inputMode="decimal" placeholder="15000"
            className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
        </div>

        <div>
          <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Fecha del pago</label>
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
            className="w-full px-4 py-3.5 border border-input rounded-xl text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
        </div>

        <div>
          <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Método</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "sinpe", label: "SINPE" },
              { key: "transferencia", label: "Transf." },
              { key: "efectivo", label: "Efectivo" },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={`py-3 px-2 rounded-xl text-[12px] font-bold border-2 transition cursor-pointer ${
                  method === m.key
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
          <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Comprobante (foto)</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleReceiptFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full min-h-[130px] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleReceiptFile(e.target.files[0]); }} />
            {receiptDataUrl ? (
              <div className="flex flex-col items-center gap-2 p-3">
                <img src={receiptDataUrl} alt="comprobante" className="max-h-[120px] rounded-xl border border-border shadow-sm" />
                <span className="text-[11px] text-muted-foreground font-medium">Click para cambiar</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 p-5">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground">
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="text-[13px] text-muted-foreground font-semibold">Subí foto del comprobante</span>
                <span className="text-[11px] text-muted-foreground/60">o arrastrá la imagen acá</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[12px] text-destructive font-semibold">
            {error}
          </p>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full py-3.5 border-none rounded-xl text-[14px] font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Reportar pago"}
        </button>
      </form>

      {/* Payment history */}
      <div className="backdrop-blur-xl bg-card/70 dark:bg-card/50 border border-border/50 rounded-2xl p-5 shadow-lg">
        <h2 className="text-[15px] font-extrabold text-foreground mb-3">Historial</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-[56px] bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="5" width="22" height="14" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><line x1="6" y1="16" x2="10" y2="16" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-foreground">Sin pagos registrados</p>
            <p className="text-[12px] mt-1">Usá el formulario de arriba para reportar tu primer pago</p>
          </div>
        ) : (
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-foreground">
                      ₡{p.amount?.toLocaleString?.("es-CR") || p.amount}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-CR") : new Date(p.createdAt).toLocaleDateString("es-CR")} — {p.method}
                    </div>
                  </div>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer"
                      className="text-[11px] font-bold text-primary hover:underline shrink-0 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Ver
                    </a>
                  )}
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}
