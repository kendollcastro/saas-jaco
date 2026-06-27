import { prisma } from "./prisma";

export const AVAILABLE_MODULES = [
  { key: "bookings", name: "Reservas", description: "Booking de tours, clases y actividades", price: 30 },
  { key: "staff", name: "Staff", description: "Gestión de horarios e instructores", price: 20 },
  { key: "menu", name: "Menú Digital", description: "Menú QR para restaurantes", price: 15 },
  { key: "inventory", name: "Inventario", description: "Control de stock básico", price: 20 },
] as const;

export async function getActiveModules(tenantId: string) {
  const modules = await prisma.tenantModule.findMany({
    where: { tenantId, active: true },
    include: { module: true },
  });
  return modules.map((m: { module: { id: string; key: string; name: string; description: string | null; price: number } }) => m.module);
}

export async function isModuleActive(tenantId: string, moduleKey: string) {
  const tm = await prisma.tenantModule.findUnique({
    where: { tenantId_moduleId: { tenantId, moduleId: moduleKey } },
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
