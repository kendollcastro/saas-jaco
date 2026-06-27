import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign } from "lucide-react";

const stats = [
  {
    title: "Reservas hoy",
    value: "12",
    change: "+8%",
    changeLabel: "vs. ayer",
    icon: Calendar,
    color: "#1e40af",
  },
  {
    title: "Clientes nuevos",
    value: "34",
    change: "+12%",
    changeLabel: "este mes",
    icon: Users,
    color: "#1e40af",
  },
  {
    title: "Ingresos del mes",
    value: "₡4.850.000",
    change: "+23%",
    changeLabel: "vs. mayo",
    icon: DollarSign,
    color: "#1e40af",
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mb-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white border border-[#e8ecf2] rounded-2xl p-[22px] flex flex-col gap-3.5 shadow-[0_1px_2px_rgba(16,26,54,.03)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748b]">
                {stat.title}
              </span>
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}1a`, color: stat.color }}
              >
                <stat.icon className="size-[17px]" />
              </div>
            </div>
            <div className="text-[38px] font-extrabold tracking-tight leading-none text-[#0f172a]">
              {stat.value}
            </div>
            <div className="flex items-center gap-[7px] text-[12.5px]">
              <span className="inline-flex items-center gap-[3px] font-bold text-[#15803d] bg-[#dcfce7] px-[7px] py-[2px] rounded-md">
                ↑ {stat.change}
              </span>
              <span className="text-[#94a3b8]">{stat.changeLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Próximas reservas */}
      <div className="bg-white border border-[#e8ecf2] rounded-2xl shadow-[0_1px_2px_rgba(16,26,54,.03)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-[18px] border-b border-[#eef2f6]">
          <div>
            <div className="text-[15.5px] font-extrabold text-[#0f172a]">
              Próximas reservas
            </div>
            <div className="text-[12.5px] text-[#94a3b8] mt-0.5">
              Agenda de los próximos días
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[#fafbfc]">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Servicio
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Personas
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#eef2f6]">
                <td
                  colSpan={5}
                  className="text-center py-12 text-[#94a3b8] text-sm font-semibold"
                >
                  No hay reservas próximas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
