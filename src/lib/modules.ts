import { prisma } from "./prisma";

export const AVAILABLE_MODULES = [
  { key: "bookings", name: "Reservas", description: "Booking de tours, clases y actividades", price: 30 },
  { key: "staff", name: "Staff", description: "Gestión de horarios e instructores", price: 20 },
  { key: "memberships", name: "Socios y Membresías", description: "Gestión de clientes y membresías", price: 20 },
  { key: "inventory", name: "Inventario", description: "Control de stock y POS", price: 25 },
  { key: "invoicing", name: "Facturación Electrónica", description: "Facturas electrónicas Hacienda CR", price: 25 },
  { key: "menu", name: "Menú Digital", description: "Menú QR para restaurantes", price: 15 },
  { key: "construction", name: "Proyectos de Construcción", description: "Proyectos, cotizaciones por partidas y gastos de obra", price: 30 },
] as const;

export async function getActiveModules(tenantId: string) {
  const modules = await prisma.tenantModule.findMany({
    where: { tenantId, active: true },
    include: { module: true },
  });
  return modules.map((m: { module: { id: string; key: string; name: string; description: string | null; price: number } }) => m.module);
}

export async function isModuleActive(tenantId: string, moduleKey: string) {
  const tm = await prisma.tenantModule.findFirst({
    where: { tenantId, module: { key: moduleKey } },
  });
  return tm?.active ?? false;
}

export async function seedModules() {
  for (const mod of AVAILABLE_MODULES) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: { name: mod.name, description: mod.description, price: mod.price },
      create: { key: mod.key, name: mod.name, description: mod.description, price: mod.price },
    });
  }
}
