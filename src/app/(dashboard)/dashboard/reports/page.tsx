"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { BarChart3, Download, Users, Package, ShoppingCart } from "lucide-react";
import { downloadCSV } from "@/lib/csv";

const ReportsCharts = dynamic(() => import("./reports-charts"), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-card rounded-2xl animate-pulse border border-border" />)}
    </div>
  ),
});

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Error al cargar reportes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-[jacoFade_0.25s_ease] space-y-5">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-card rounded-2xl animate-pulse border border-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <h1 className="text-[21px] font-extrabold tracking-tight text-foreground mb-6">Reportes</h1>

      <Suspense fallback={null}>
        <ReportsCharts data={data} />
      </Suspense>

      {/* CSV Exports */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="size-[16px] text-primary" />
          <h2 className="text-[14.5px] font-extrabold text-foreground">Exportar datos</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ExportButton label="Reservas" icon={BarChart3} onClick={() => {
            downloadCSV(["Cliente", "Teléfono", "Servicio", "Fecha", "Estado", "Total", "Staff"],
              data?.csv?.bookings || [], "reservas");
          }} />
          <ExportButton label="Socios" icon={Users} onClick={() => {
            downloadCSV(["Nombre", "Teléfono", "Email", "Membresía", "Estado", "Inicio", "Fin"],
              data?.csv?.members || [], "socios");
          }} />
          <ExportButton label="Productos" icon={Package} onClick={() => {
            downloadCSV(["Nombre", "Código", "Precio", "Costo", "Stock", "Categoría"],
              data?.csv?.products || [], "productos");
          }} />
          <ExportButton label="Ventas" icon={ShoppingCart} onClick={() => {
            downloadCSV(["Fecha", "Cliente", "Total", "Método", "Estado", "Items"],
              data?.csv?.sales || [], "ventas");
          }} />
        </div>
      </div>
    </div>
  );
}

function ExportButton({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 rounded-[10px] border border-border hover:bg-muted/30 hover:border-primary/30 transition text-left"
    >
      <Icon className="size-[15px] text-muted-foreground" />
      <span className="text-[13px] font-bold text-foreground">{label}</span>
    </button>
  );
}
