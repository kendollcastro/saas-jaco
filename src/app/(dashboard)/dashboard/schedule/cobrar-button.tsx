"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function CobrarButton({
  booking,
  compact = false,
}: {
  booking: { id: string; memberPhone?: string | null };
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCharge() {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule/bookings/${booking.id}/charge`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al generar link"); return; }
      navigator.clipboard.writeText(data.url).catch(() => {});
      const cleaned = (booking.memberPhone || "").replace(/[^0-9]/g, "");
      const waMsg = `Hola! 👋 Acá va tu link para pagar la clase extra: ${data.url}`;
      if (cleaned) {
        window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(waMsg)}`, "_blank");
      }
      toast.success("Link de pago generado y copiado");
    } catch {
      toast.error("Error al generar link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCharge(); }}
      disabled={loading}
      title="Cobrar clase extra por WhatsApp"
      className={`border-none cursor-pointer transition disabled:opacity-50 font-bold ${
        compact
          ? "ml-0.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] hover:bg-amber-200 dark:hover:bg-amber-900/50"
          : "shrink-0 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] hover:bg-amber-200 dark:hover:bg-amber-900/50"
      }`}
    >
      {loading ? "..." : "Cobrar"}
    </button>
  );
}
