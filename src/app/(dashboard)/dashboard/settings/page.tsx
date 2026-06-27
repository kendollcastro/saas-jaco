export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Mi negocio en Jacó" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="+506 8888 8888" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" type="email" placeholder="info@mnegocio.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Jacó, Costa Rica" />
        </div>
        <hr className="border-gray-200" />
        <h3 className="font-semibold text-sm">Módulos activos</h3>
        <div className="space-y-2">
          {[
            { key: "bookings", name: "Reservas", active: true },
            { key: "staff", name: "Staff", active: false },
            { key: "menu", name: "Menú Digital", active: false },
            { key: "inventory", name: "Inventario", active: false },
          ].map((mod) => (
            <label key={mod.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={mod.active} className="rounded" />
              {mod.name}
            </label>
          ))}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
