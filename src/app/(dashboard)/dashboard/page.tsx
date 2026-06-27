export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Reservas hoy</div>
          <div className="text-3xl font-bold mt-1">0</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Clientes nuevos</div>
          <div className="text-3xl font-bold mt-1">0</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Ingresos del mes</div>
          <div className="text-3xl font-bold mt-1">₡0</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-2">Próximas reservas</h2>
        <p className="text-gray-500 text-sm">No hay reservas próximas.</p>
      </div>
    </div>
  );
}
