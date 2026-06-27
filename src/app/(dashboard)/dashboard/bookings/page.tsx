import Link from "next/link";

export default async function BookingsPage() {
  const bookings: never[] = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <Link
          href="/dashboard/bookings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + Nueva reserva
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <p className="font-medium">No hay reservas aún</p>
            <p className="text-sm mt-1">Crea la primera reserva para empezar</p>
            <Link
              href="/dashboard/bookings/new"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + Nueva reserva
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Servicio</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Personas</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody>{bookings.map(() => null)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
