import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
  { key: "bookings", name: "Reservas", description: "Booking de tours, clases y actividades", price: 30 },
  { key: "staff", name: "Staff", description: "Gestión de horarios e instructores", price: 20 },
  { key: "menu", name: "Menú Digital", description: "Menú QR para restaurantes", price: 15 },
  { key: "inventory", name: "Inventario", description: "Control de stock básico", price: 20 },
];

async function main() {
  console.log("Seeding modules...");
  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: mod,
      create: mod,
    });
  }

  const bookingsModule = await prisma.module.findUnique({ where: { key: "bookings" } });
  const staffModule = await prisma.module.findUnique({ where: { key: "staff" } });

  if (bookingsModule && staffModule) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: "demo" },
      update: {},
      create: {
        name: "Demo Jacó",
        slug: "demo",
        email: "demo@jaco.com",
        plan: "pro",
        settings: {
          create: {
            businessName: "Demonstración Jacó Surf & Tours",
            businessPhone: "+506 8888 8888",
            businessEmail: "info@demojaco.com",
            address: "Jacó, Costa Rica",
          },
        },
        modules: {
          create: [
            { moduleId: bookingsModule.id, active: true },
            { moduleId: staffModule.id, active: true },
          ],
        },
      },
    });
    console.log(`Demo tenant created: ${tenant.name}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
