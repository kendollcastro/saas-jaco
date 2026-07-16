import { PrismaClient } from "@prisma/client";
import { hashPin, generateToken } from "../src/lib/portal-auth";

const prisma = new PrismaClient();

const testMembers = [
  { name: "Andrea Cordero", phone: "+506 6017-9991", email: "andrea@ejemplo.com", membership: "mensual", status: "active", daysOffset: -20, pin: "1234" },
  { name: "Josué Rojas", phone: "+506 6017-9992", email: "josue@ejemplo.com", membership: "trimestral", status: "active", daysOffset: -45, pin: "1234" },
  { name: "Melissa Quesada", phone: "+506 6017-9993", email: null, membership: "mensual", status: "active", daysOffset: -5, pin: "1234" },
  { name: "Esteban Vega", phone: "+506 6017-9994", email: "esteban@ejemplo.com", membership: "semestral", status: "active", daysOffset: -90, pin: "1234" },
  { name: "Gloria Sandí", phone: "+506 6017-9995", email: null, membership: "mensual", status: "pending", daysOffset: 0, pin: "1234" },
  { name: "Fabricio Mora", phone: "+506 6017-9996", email: "fabricio@ejemplo.com", membership: "anual", status: "active", daysOffset: -150, pin: "1234" },
  { name: "Daniela Fallas", phone: "+506 6017-9997", email: null, membership: "mensual", status: "expired", daysOffset: -45, pin: "1234" },
  { name: "Alejandro Navarro", phone: "+506 6017-9998", email: "alejandro@ejemplo.com", membership: "trimestral", status: "active", daysOffset: -30, pin: "1234" },
  { name: "Karen Pérez", phone: "+506 6017-9999", email: "karen@ejemplo.com", membership: "mensual", status: "pending", daysOffset: 0, pin: "1234" },
  { name: "Luis Diego Araya", phone: "+506 6017-9900", email: null, membership: "mensual", status: "active", daysOffset: -60, pin: "5678" },
];

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) { console.error("No tenant found"); return; }

  console.log(`Using tenant: ${tenant.name} (${tenant.id})`);

  for (const m of testMembers) {
    const existing = await prisma.member.findFirst({ where: { tenantId: tenant.id, phone: m.phone } });
    if (existing) {
      console.log(`  Skipping ${m.name} — already exists`);
      continue;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + m.daysOffset);
    let endDate: Date | null = null;
    if (m.membership === "mensual") { endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + 1); }
    else if (m.membership === "trimestral") { endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + 3); }
    else if (m.membership === "semestral") { endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + 6); }
    else if (m.membership === "anual") { endDate = new Date(startDate); endDate.setFullYear(endDate.getFullYear() + 1); }

    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        name: m.name,
        phone: m.phone,
        email: m.email,
        membership: m.membership,
        status: m.status,
        startDate,
        endDate,
        pin: hashPin(m.pin),
        authToken: generateToken(),
      },
    });

    // Create a payment for active/expired members
    if (m.status === "active" || m.status === "expired") {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
      const now = new Date();
      await prisma.memberPayment.create({
        data: {
          tenantId: tenant.id,
          memberId: member.id,
          amount: 15000,
          method: "sinpe",
          periodFrom: startDate,
          periodTo: endDate,
          notes: `Pago ${m.membership} — ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        },
      });
    } else if (m.status === "pending") {
      // Create a payment with receipt for pending members (simulating they already paid but awaiting confirmation)
      await prisma.memberPayment.create({
        data: {
          tenantId: tenant.id,
          memberId: member.id,
          amount: 15000,
          method: "sinpe",
          receiptUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5Db21wcm9iYW50ZSBkZSBwYWdvPC90ZXh0Pjwvc3ZnPg==",
          periodFrom: startDate,
          periodTo: endDate,
          notes: `Pago pendiente — ${m.membership}`,
        },
      });
    }

    console.log(`  Created ${m.name} (${m.status}) — PIN: ${m.pin}`);
  }

  // Create some schedule bookings for active members with future dates
  const activeMembers = await prisma.member.findMany({
    where: { tenantId: tenant.id, status: "active" },
    take: 5,
  });

  const slots = await prisma.scheduleSlot.findMany({
    where: { tenantId: tenant.id, active: true },
    take: 3,
  });

  if (slots.length > 0 && activeMembers.length > 0) {
    for (let i = 0; i < Math.min(activeMembers.length, 5); i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (i + 2) % 14 + 1);
      const slot = slots[i % slots.length];
      const member = activeMembers[i];

      const existingBooking = await prisma.scheduleBooking.findFirst({
        where: { slotId: slot.id, date: futureDate, memberPhone: member.phone },
      });
      if (existingBooking) continue;

      await prisma.scheduleBooking.create({
        data: {
          tenantId: tenant.id,
          slotId: slot.id,
          memberName: member.name,
          memberPhone: member.phone,
          date: futureDate,
          status: "confirmed",
        },
      });
      console.log(`  Booking: ${member.name} → ${futureDate.toLocaleDateString("es-CR")} slot ${slot.startTime}`);
    }
  } else {
    console.log("  No slots found for test bookings. Create slots first in the admin schedule page.");
  }

  console.log("\nDone! Test credentials:");
  console.log("All test members use PIN: 1234 (except Luis Diego Araya: 5678)");
  console.log(`Login at /portal/login with any phone number above + their PIN`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
