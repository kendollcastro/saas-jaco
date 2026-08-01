import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@dondecasinni.com";
const DEMO_PASSWORD = "demo123";
const TENANT_SLUG = "donde-casinni";
const TENANT_NAME = "donde Casinni";

const PLANS = [
  { name: "Mensual Ilimitado", description: "Acceso total al gym, todos los días", price: 25000, durationDays: 30 },
  { name: "3 días / semana", description: "Acceso lunes-miércoles-viernes o mar-jue-sáb", price: 18000, durationDays: 30 },
  { name: "Trimestral", description: "3 meses con 10% de descuento", price: 67500, durationDays: 90 },
  { name: "Semestral", description: "6 meses con 15% de descuento", price: 127500, durationDays: 180 },
  { name: "Anual", description: "12 meses con 20% de descuento", price: 240000, durationDays: 365 },
];

const MEMBERS = [
  { name: "María Fernanda Solís", phone: "+506 8845 1203", email: "maria.solis@email.com" },
  { name: "José Pablo Vargas", phone: "+506 8812 4570", email: "jp.vargas@email.com" },
  { name: "Andrea Quesada", phone: "+506 8874 2201", email: "andrea.quesada@email.com" },
  { name: "Luis Diego Campos", phone: "+506 8890 5544", email: "ld.campos@email.com" },
  { name: "Valeria Mora", phone: "+506 8833 9876", email: "vale.mora@email.com" },
  { name: "Sebastián Rojas", phone: "+506 8867 3321", email: "sebas.rojas@email.com" },
  { name: "Daniela Fallas", phone: "+506 8899 7654", email: "dani.fallas@email.com" },
  { name: "Andrés Jiménez", phone: "+506 8844 2310", email: "andres.jimenez@email.com" },
  { name: "Melissa Chacón", phone: "+506 8811 9087", email: "meli.chacon@email.com" },
  { name: "Fabián Herrera", phone: "+506 8877 6543", email: "fabian.herrera@email.com" },
  { name: "Karla Navarro", phone: "+506 8830 1122", email: "karla.navarro@email.com" },
  { name: "Ricardo Sandí", phone: "+506 8866 8901", email: "richy.sandi@email.com" },
];

const PRODUCTS = [
  { name: "Proteína Whey 1kg", description: "Proteína de suero sabor chocolate", price: 32000, cost: 24000, stock: 15, category: "suplementos" },
  { name: "Shaker 700ml", description: "Botella mezcladora con bola de acero", price: 5500, cost: 3000, stock: 30, category: "accesorios" },
  { name: "Agua 500ml", description: "Agua natural", price: 1000, cost: 400, stock: 80, category: "bebidas" },
  { name: "Barrita Energética", description: "Snack proteico 30g", price: 1500, cost: 800, stock: 50, category: "snacks" },
  { name: "BCAA 400g", description: "Aminoácidos ramificados sabor frutos rojos", price: 28000, cost: 19000, stock: 10, category: "suplementos" },
  { name: "Guantes de Gym", description: "Guantes de entrenamiento talla L", price: 12000, cost: 7500, stock: 12, category: "accesorios" },
  { name: "Creatina 300g", description: "Creatina monohidratada micronizada", price: 22000, cost: 15000, stock: 18, category: "suplementos" },
  { name: "Gatorade 500ml", description: "Bebida hidratante deportiva", price: 1200, cost: 500, stock: 60, category: "bebidas" },
];

const SERVICES = [
  { name: "Clase de CrossFit", duration: 60, price: 8000 },
  { name: "Clase de Spinning", duration: 45, price: 6000 },
  { name: "Clase de Yoga", duration: 60, price: 6500 },
  { name: "Entrenamiento Personal", duration: 60, price: 15000 },
  { name: "Clase de Funcional", duration: 45, price: 7000 },
  { name: "Clase de Box", duration: 60, price: 7500 },
];

const STAFF = [
  { name: "Carlos Casinni", phone: "+506 8844 5566", email: "carlos@dondecasinni.com", role: "Owner / Head Coach" },
  { name: "Mariana Cordero", phone: "+506 8877 8899", email: "mariana@dondecasinni.com", role: "Instructora CrossFit" },
  { name: "Esteban Ureña", phone: "+506 8812 3344", email: "esteban@dondecasinni.com", role: "Instructor Spinning" },
  { name: "Laura Benavides", phone: "+506 8833 4455", email: "laura@dondecasinni.com", role: "Instructora Yoga" },
];

const CUSTOMERS = [
  "Carlos Jiménez", "Emily Watson", "Luis Rojas", "Sarah Johnson",
  "Michael Brown", "Ana Martínez", "David Chen", "Laura García",
];

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
  // 1. Create Supabase Auth user
  console.log("Creating Supabase auth user...");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let authUserId: string;
  const { data: existingAuth, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existingUser = existingAuth.users.find((u) => u.email === DEMO_EMAIL);
  if (existingUser) {
    console.log(`  Auth user already exists: ${existingUser.id}`);
    authUserId = existingUser.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo donde Casinni" },
    });
    if (updateError) throw updateError;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo donde Casinni" },
    });
    if (error || !data.user) throw error;
    authUserId = data.user.id;
    console.log(`  Auth user created: ${authUserId}`);
  }

  // 2. Create tenant
  console.log("Creating tenant...");
  let tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (tenant) {
    console.log(`  Tenant already exists: ${tenant.id}`);
  } else {
    tenant = await prisma.tenant.create({
      data: {
        name: TENANT_NAME,
        slug: TENANT_SLUG,
        email: DEMO_EMAIL,
        plan: "pro",
        settings: {
          create: {
            businessName: "donde Casinni",
            businessPhone: "+506 8844 5566",
            businessEmail: DEMO_EMAIL,
            address: "San José, Costa Rica",
            businessType: "gym",
            category: "gimnasio",
            slotMinutes: 60,
            maxPaxPerBooking: 15,
            onboardingDone: true,
          },
        },
      },
    });
    console.log(`  Tenant created: ${tenant.id}`);
  }

  // 3. Create DB user linked to tenant
  console.log("Creating DB user...");
  await prisma.user.upsert({
    where: { id: authUserId },
    update: { email: DEMO_EMAIL, name: "Demo donde Casinni", role: "admin", tenantId: tenant.id },
    create: { id: authUserId, email: DEMO_EMAIL, name: "Demo donde Casinni", role: "admin", tenantId: tenant.id },
  });

  // 4. Activate all modules
  console.log("Activating modules...");
  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: tenant.id, moduleId: mod.id } },
      update: { active: true },
      create: { tenantId: tenant.id, moduleId: mod.id, active: true },
    });
  }

  // 5. Seed membership plans
  console.log("Seeding membership plans...");
  await prisma.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });
  const createdPlans: { id: string; name: string; price: number; durationDays: number }[] = [];
  for (const p of PLANS) {
    const plan = await prisma.membershipPlan.create({
      data: { tenantId: tenant.id, ...p },
    });
    createdPlans.push(plan);
  }
  console.log(`  ${createdPlans.length} plans`);

  // 6. Seed members + payments
  console.log("Seeding members...");
  await prisma.memberPayment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.attendance.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.member.deleteMany({ where: { tenantId: tenant.id } });

  const createdMembers: { id: string; name: string }[] = [];
  for (const m of MEMBERS) {
    const plan = randomItem(createdPlans);
    const startDate = randomDate(60);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        name: m.name,
        phone: m.phone,
        email: m.email,
        membership: plan.name,
        planId: plan.id,
        startDate,
        endDate,
        status: "active",
      },
    });
    createdMembers.push(member);

    // Payment for this membership
    const paymentDate = new Date(startDate);
    paymentDate.setDate(paymentDate.getDate() + randomInt(0, 3));
    await prisma.memberPayment.create({
      data: {
        tenantId: tenant.id,
        memberId: member.id,
        amount: plan.price,
        method: randomItem(["efectivo", "efectivo", "sinpe"]),
        periodFrom: startDate,
        periodTo: endDate,
        createdAt: paymentDate,
      },
    });

    // 3-5 attendance records
    for (let i = 0; i < randomInt(3, 5); i++) {
      const dateIn = randomDate(20);
      const dateOut = new Date(dateIn.getTime() + randomInt(45, 90) * 60000);
      await prisma.attendance.create({
        data: { tenantId: tenant.id, memberId: member.id, dateIn, dateOut },
      });
    }
  }
  console.log(`  ${createdMembers.length} members`);

  // 7. Seed products
  console.log("Seeding products...");
  await prisma.saleItem.deleteMany({ where: { sale: { tenantId: tenant.id } } });
  await prisma.sale.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: { tenantId: tenant.id, ...p },
    });
  }
  console.log(`  ${PRODUCTS.length} products`);

  // 8. Seed services
  console.log("Seeding services...");
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  const createdServices: { id: string; name: string; price: number | null }[] = [];
  for (const s of SERVICES) {
    const svc = await prisma.service.create({
      data: { tenantId: tenant.id, ...s, description: null },
    });
    createdServices.push(svc);
  }

  // 9. Seed staff
  console.log("Seeding staff...");
  await prisma.staff.deleteMany({ where: { tenantId: tenant.id } });
  const createdStaff: { id: string }[] = [];
  for (const s of STAFF) {
    const staff = await prisma.staff.create({ data: { tenantId: tenant.id, ...s } });
    createdStaff.push(staff);
  }

  // 10. Seed bookings (gym classes)
  console.log("Seeding bookings...");
  let bookingCount = 0;
  for (let i = 0; i < 30; i++) {
    const service = randomItem(createdServices);
    const customer = randomItem(CUSTOMERS);
    const pax = randomInt(1, 6);
    const total = (service.price || 0) * pax;
    const date = randomDate(i < 10 ? 5 : 30);
    const statuses = ["pending", "confirmed", "confirmed", "completed", "cancelled"];

    await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        customerName: customer,
        customerPhone: `+506 ${randomInt(8000, 8999)} ${randomInt(1000, 9999)}`,
        customerEmail: `${customer.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        serviceId: service.id,
        serviceName: service.name,
        staffId: randomItem(createdStaff).id,
        date,
        time: `${randomInt(6, 18).toString().padStart(2, "0")}:00`,
        pax,
        total: total || null,
        status: randomItem(statuses),
        notes: i % 4 === 0 ? "Cliente nuevo" : null,
      },
    });
    bookingCount++;
  }
  console.log(`  ${bookingCount} bookings`);

  console.log("\nDone.");
  console.log(`Tenant: ${TENANT_NAME}`);
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`URL: https://olaasas.vercel.app/login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
