"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import { Receipt } from "lucide-react";
import { fmtStoredDate } from "@/lib/utils";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDate(d: string) {
  return fmtStoredDate(d, months);
}

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: "Borrador", bg: "#f1f5f9", color: "#475569" },
  sent: { label: "Enviado", bg: "#dbeafe", color: "#1d4ed8" },
  accepted: { label: "Aceptado", bg: "#dcfce7", color: "#15803d" },
  rejected: { label: "Rechazado", bg: "#fee2e2", color: "#b91c1c" },
  partial: { label: "Parcial", bg: "#fef3c7", color: "#92400e" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ])
      .then(([inv, bk]) => {
        setInvoices(Array.isArray(inv) ? inv : []);
        setBookings(Array.isArray(bk) ? bk.filter((b: any) => b.total && b.status === "confirmed") : []);
      })
      .catch(() => toast.error("Error al cargar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createFromBooking(booking: any) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          customerId: booking.customerPhone || "000000000",
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          items: [
            {
              description: booking.serviceName,
              quantity: booking.pax,
              unitPrice: booking.total / booking.pax,
              taxRate: 13,
            },
          ],
        }),
      });
      if (res.ok) {
        toast.success("Factura creada");
        setShowForm(false);
        setSelectedBooking(null);
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear factura");
      }
    } catch {
      toast.error("Error al crear factura");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">
          Facturación Electrónica
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <ReceiptIcon />
          Nueva factura
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Receipt className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">No hay facturas</p>
            <p className="text-sm mt-1">Crea una factura desde una reserva confirmada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Consecutivo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = statusStyles[inv.status] || statusStyles.draft;
                  return (
                    <tr key={inv.id} className="border-t border-border">
                      <td className="px-5 py-3 text-[13px] font-mono font-bold text-muted-foreground">{inv.consecutive}</td>
                      <td className="px-4 py-3 text-[13.5px] text-foreground">{inv.customerName}</td>
                      <td className="px-4 py-3 text-[13.5px] font-bold text-foreground text-right">
                        ₡{inv.total.toLocaleString("de-DE")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-[11px] py-[4px] rounded-full text-xs font-bold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground text-right">{formatDate(inv.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedBooking(null); }}
        title="Nueva factura"
        description="Selecciona una reserva confirmada para facturar"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-3">
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No hay reservas confirmadas para facturar
              </p>
            ) : (
              bookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBooking(b);
                    createFromBooking(b);
                  }}
                  disabled={submitting}
                  className="w-full text-left p-4 border border-input rounded-[12px] bg-background hover:bg-muted transition cursor-pointer disabled:opacity-50"
                >
                  <div className="font-bold text-[14px] text-foreground">{b.customerName}</div>
                  <div className="flex items-center gap-3 mt-1 text-[12.5px] text-muted-foreground">
                    <span>{b.serviceName}</span>
                    <span>•</span>
                    <span>{b.pax} pax</span>
                    <span>•</span>
                    <span className="font-bold text-foreground">₡{b.total?.toLocaleString("de-DE")}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </SlideOver>
    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
    </svg>
  );
}
