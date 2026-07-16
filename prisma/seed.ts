import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
  { key: "bookings", name: "Reservas", description: "Booking de tours, clases y actividades", price: 30 },
  { key: "staff", name: "Staff", description: "Gestión de horarios e instructores", price: 20 },
  { key: "invoicing", name: "Facturación Electrónica", description: "Facturas electrónicas Hacienda CR", price: 25 },
  { key: "memberships", name: "Socios y Membresías", description: "Gestión de clientes, membresías y pagos", price: 20 },
  { key: "inventory", name: "Inventario y Productos", description: "Control de stock, productos y ventas", price: 20 },
  { key: "menu", name: "Menú Digital", description: "Menú QR para restaurantes", price: 15 },
];

const PLANS = [
  { name: "Free", slug: "free", description: "Prueba la plataforma sin costo", price: 0, interval: "monthly", sortOrder: 0, modules: ["bookings"] },
  { name: "Starter", slug: "starter", description: "Para negocios pequeños que empiezan", price: 2900, interval: "monthly", sortOrder: 1, modules: ["bookings", "staff"] },
  { name: "Growth", slug: "growth", description: "Para negocios en crecimiento", price: 7900, interval: "monthly", sortOrder: 2, modules: ["bookings", "staff", "memberships", "inventory"] },
  { name: "Pro", slug: "pro", description: "Todo incluido para negocios establecidos", price: 14900, interval: "monthly", sortOrder: 3, modules: ["bookings", "staff", "memberships", "inventory", "invoicing", "menu"] },
];

const SERVICES = [
  { name: "Clase de Surf (Principiante)", price: 45000, duration: 120 },
  { name: "Clase de Surf (Intermedio)", price: 55000, duration: 120 },
  { name: "Tour ATV 2hrs", price: 80000, duration: 120 },
  { name: "Tour ATV 4hrs", price: 140000, duration: 240 },
  { name: "Pesca Deportiva 4hrs", price: 200000, duration: 240 },
  { name: "Pesca Deportiva 8hrs", price: 350000, duration: 480 },
  { name: "Tour Boat Sunset", price: 65000, duration: 150 },
  { name: "Snorkeling Jacó", price: 35000, duration: 180 },
  { name: "Alquiler Tabla Surf", price: 15000, duration: 360 },
  { name: "Boleto Catamarán", price: 55000, duration: 240 },
];

const STAFF = [
  { name: "Diego Mora", phone: "+506 8888 1001", role: "instructor" },
  { name: "Sofía Ramírez", phone: "+506 8888 1002", role: "instructor" },
  { name: "Carlos Umaña", phone: "+506 8888 1003", role: "guide" },
  { name: "María Fernández", phone: "+506 8888 1004", role: "admin" },
  { name: "Jorge Vargas", phone: "+506 8888 1005", role: "driver" },
  { name: "Andrea Campos", phone: "+506 8888 1006", role: "guide" },
];

const CUSTOMERS = [
  "Carlos Jiménez", "Emily Watson", "Luis Rojas", "Sarah Johnson",
  "Michael Brown", "Ana Martínez", "David Chen", "Laura García",
  "James Wilson", "Katherine Lee", "Andrés Herrera", "Rachel Green",
  "Tommy Smith", "Paula Mora", "Ryan O\'Brien", "Daniela Vargas",
];

const STATUSES = ["pending", "confirmed", "completed", "completed", "cancelled"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding modules...");
  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: mod,
      create: mod,
    });
  }

  // Seed plans
  console.log("Seeding plans...");
  const allModules = await prisma.module.findMany();
  const moduleByKey = Object.fromEntries(allModules.map((m) => [m.key, m]));
  for (const plan of PLANS) {
    const { modules: planModuleKeys, ...planData } = plan;
    const record = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: planData,
      create: { ...planData },
    });
    // Sync plan modules
    const currentModuleIds = planModuleKeys.filter((k) => moduleByKey[k]).map((k) => moduleByKey[k].id);
    await prisma.planModule.deleteMany({ where: { planId: record.id, moduleId: { notIn: currentModuleIds } } });
    for (const moduleId of currentModuleIds) {
      await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: record.id, moduleId } },
        update: {},
        create: { planId: record.id, moduleId },
      });
    }
  }

  const bookingsModule = await prisma.module.findUnique({ where: { key: "bookings" } });
  const staffModule = await prisma.module.findUnique({ where: { key: "staff" } });

  if (!bookingsModule || !staffModule) {
    console.error("Modules not found");
    return;
  }

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
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  // Delete existing demo data for this tenant
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.staff.deleteMany({ where: { tenantId: tenant.id } });

  // Create services
  console.log("Creating services...");
  const services = [];
  for (const s of SERVICES) {
    const svc = await prisma.service.create({
      data: { tenantId: tenant.id, ...s, description: null },
    });
    services.push(svc);
  }
  console.log(`  ${services.length} services`);

  // Create staff
  console.log("Creating staff...");
  const staffMembers = [];
  for (const s of STAFF) {
    const member = await prisma.staff.create({
      data: { tenantId: tenant.id, ...s },
    });
    staffMembers.push(member);
  }
  console.log(`  ${staffMembers.length} staff`);

  // Create bookings
  console.log("Creating bookings...");
  let bookingCount = 0;
  for (let i = 0; i < 25; i++) {
    const service = randomItem(services);
    const customer = randomItem(CUSTOMERS);
    const pax = randomInt(1, 8);
    const total = (service.price || 45000) * pax;
    const deposit = Math.round(total * randomItem([0, 0, 0.3, 0.5]));
    const date = randomDate(i < 10 ? 5 : 30);
    const status = i < 10 ? STATUSES[randomInt(0, 2)] : randomItem(STATUSES);

    await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        customerName: customer,
        customerPhone: `+506 ${randomInt(8000, 8999)} ${randomInt(1000, 9999)}`,
        customerEmail: `${customer.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        serviceId: service.id,
        serviceName: service.name,
        staffId: randomItem(staffMembers).id,
        date,
        time: `${randomInt(6, 14).toString().padStart(2, "0")}:00`,
        pax,
        total,
        deposit: deposit || null,
        status,
        notes: i % 3 === 0 ? "Cliente pidió recoger en hotel" : null,
      },
    });
    bookingCount++;
  }
  console.log(`  ${bookingCount} bookings`);

  // Create schedule slots (for schedule booking module)
  console.log("Creating schedule slots...");
  const SCHEDULE_SLOTS = [
    { dayOfWeek: 1, startTime: "08:00", endTime: "09:00", capacity: 5 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", capacity: 5 },
    { dayOfWeek: 1, startTime: "10:00", endTime: "11:00", capacity: 5 },
    { dayOfWeek: 2, startTime: "08:00", endTime: "09:00", capacity: 5 },
    { dayOfWeek: 2, startTime: "09:00", endTime: "10:00", capacity: 5 },
    { dayOfWeek: 2, startTime: "10:00", endTime: "11:00", capacity: 5 },
    { dayOfWeek: 3, startTime: "08:00", endTime: "09:00", capacity: 5 },
    { dayOfWeek: 3, startTime: "09:00", endTime: "10:00", capacity: 5 },
    { dayOfWeek: 3, startTime: "14:00", endTime: "15:00", capacity: 3 },
    { dayOfWeek: 4, startTime: "08:00", endTime: "09:00", capacity: 5 },
    { dayOfWeek: 4, startTime: "09:00", endTime: "10:00", capacity: 5 },
    { dayOfWeek: 5, startTime: "08:00", endTime: "09:00", capacity: 5 },
    { dayOfWeek: 5, startTime: "09:00", endTime: "10:00", capacity: 5 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "09:00", capacity: 3 },
    { dayOfWeek: 6, startTime: "09:00", endTime: "10:00", capacity: 3 },
  ];
  const scheduleSlots = [];
  for (const s of SCHEDULE_SLOTS) {
    const existing = await prisma.scheduleSlot.findFirst({
      where: { tenantId: tenant.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime },
    });
    if (existing) { scheduleSlots.push(existing); continue; }
    const slot = await prisma.scheduleSlot.create({ data: { tenantId: tenant.id, ...s } });
    scheduleSlots.push(slot);
  }
  console.log(`  ${scheduleSlots.length} schedule slots`);

  // Create schedule bookings (confirmed, spread across upcoming days)
  console.log("Creating schedule bookings...");
  let scheduleBookingCount = 0;
  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  for (let i = 0; i < 15; i++) {
    const future = new Date();
    future.setDate(future.getDate() + (i % 21) + 1);
    const dayOfWeek = future.getDay();
    const matchingSlots = scheduleSlots.filter((s) => s.dayOfWeek === dayOfWeek);
    if (matchingSlots.length === 0) continue;
    const slot = randomItem(matchingSlots);
    const customer = randomItem(CUSTOMERS);
    await prisma.scheduleBooking.create({
      data: {
        tenantId: tenant.id,
        slotId: slot.id,
        date: future,
        memberName: customer,
        memberPhone: `+506 ${randomInt(8000, 8999)} ${randomInt(1000, 9999)}`,
        memberEmail: `${customer.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        status: "confirmed",
        notes: i % 4 === 0 ? "Primera vez" : null,
      },
    });
    scheduleBookingCount++;
  }
  console.log(`  ${scheduleBookingCount} schedule bookings`);

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
