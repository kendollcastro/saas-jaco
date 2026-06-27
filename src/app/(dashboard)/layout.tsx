import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Reservas", href: "/dashboard/bookings", icon: "📅" },
  { label: "Staff", href: "/dashboard/staff", icon: "👥" },
  { label: "Servicios", href: "/dashboard/services", icon: "🏄" },
  { label: "Configuración", href: "/dashboard/settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="font-bold text-lg mb-6 text-blue-600">Jacó SaaS</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
