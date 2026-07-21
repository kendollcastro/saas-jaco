"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PayPage() {
  const { token } = useParams<{ token: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("sinpe");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");
  const [sinpeRef, setSinpeRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLinkData(data);
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [token]);

  function handleReceiptFile(file: File) {
    if (!file.type.startsWith("image/")) { return; }
    const reader = new FileReader();
    reader.onload = (e) => setReceiptDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pay/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, receiptUrl: receiptDataUrl || null, sinpeRef: sinpeRef || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (error && !linkData) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <XCircle className="size-12 mx-auto text-destructive" />
        <h1 className="text-xl font-extrabold text-foreground">Link no válido</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5 bg-white dark:bg-card border border-border/50 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="size-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">¡Pago reportado!</h2>
        <p className="text-sm text-muted-foreground">El negocio va a confirmar tu pago pronto. Guardá tu comprobante.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          {linkData?.logoUrl && (
            <img src={linkData.logoUrl} alt="logo" className="w-14 h-14 rounded-2xl mx-auto object-contain bg-white dark:bg-card border border-border/50 shadow-sm" />
          )}
          <h1 className="text-xl font-extrabold text-foreground">{linkData?.businessName || "Pago"}</h1>
          <p className="text-sm text-muted-foreground">Completá tu pago para {linkData?.memberName}</p>
        </div>

        {/* Amount card */}
        <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 text-center shadow-xl space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Monto a pagar</p>
          <p className="text-4xl font-extrabold text-foreground">₡{linkData?.amount?.toLocaleString?.("es-CR") || linkData?.amount}</p>
          <p className="text-sm text-muted-foreground">{linkData?.concept}</p>
        </div>

        {/* SINPE Info */}
        {linkData?.sinpePhone && (
          <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-5 shadow-xl space-y-3">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Datos para SINPE Móvil</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-4 bg-muted/50 rounded-xl">
                <span className="text-sm text-muted-foreground">Teléfono</span>
                <span className="text-base font-bold text-foreground">{linkData.sinpePhone}</span>
              </div>
              {linkData.sinpeName && (
                <div className="flex justify-between items-center py-2 px-4 bg-muted/50 rounded-xl">
                  <span className="text-sm text-muted-foreground">Nombre</span>
                  <span className="text-base font-bold text-foreground">{linkData.sinpeName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-card border border-border/50 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Confirmar pago</h2>

          {/* Method */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "sinpe", label: "SINPE Móvil" },
                { key: "transferencia", label: "Transferencia" },
              ].map((m) => (
                <button key={m.key} type="button" onClick={() => setMethod(m.key)}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                    method === m.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground hover:border-primary/50"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SINPE reference */}
          {method === "sinpe" && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Referencia SINPE (opcional)</label>
              <input value={sinpeRef} onChange={(e) => setSinpeRef(e.target.value)}
                placeholder="Ej: 123456"
                className="w-full px-4 py-3 border border-input rounded-xl text-sm font-sans text-foreground bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
            </div>
          )}

          {/* Receipt upload */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Comprobante (foto)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed rounded-2xl cursor-pointer transition-all border-border bg-muted/30 hover:border-primary/50"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleReceiptFile(e.target.files[0]); }} />
              {receiptDataUrl ? (
                <img src={receiptDataUrl} alt="comprobante" className="max-h-[100px] rounded-xl m-2" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-4">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground">
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Subir comprobante</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 border-none rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground cursor-pointer shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50">
            {submitting ? "Enviando..." : "Confirmar pago"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Este link expira en 7 días
        </p>
      </div>
    </div>
  );
}
