import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalMember } from "@/lib/portal-auth";

function startOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

class PortalBookingError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

export async function GET(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const bookings = await prisma.scheduleBooking.findMany({
    where: {
      tenantId: member.tenantId,
      OR: [{ memberId: member.id }, { memberPhone: member.phone || undefined }],
    },
    include: { slot: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (member.status !== "active") return NextResponse.json({ error: "Membresía no activa. Realizá el pago primero." }, { status: 400 });

  const { slotId, date } = await request.json();
  if (!slotId || !date) return NextResponse.json({ error: "slotId y date requeridos" }, { status: 400 });

  const targetDate = new Date(date);

  const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
  if (!slot || !slot.active) return NextResponse.json({ error: "Horario no disponible" }, { status: 400 });
  if (slot.dayOfWeek !== targetDate.getUTCDay()) {
    return NextResponse.json({ error: "La fecha no corresponde al día del horario seleccionado" }, { status: 400 });
  }

  const memberWithPlan = await prisma.member.findUnique({
    where: { id: member.id },
    include: { plan: true },
  });
  const sessionsPerWeek = memberWithPlan?.plan?.sessionsPerWeek ?? null;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ScheduleSlot" WHERE id = ${slotId} FOR UPDATE`;

      if (sessionsPerWeek != null) {
        const weekStart = startOfWeekUTC(targetDate);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weeklyCount = await tx.scheduleBooking.count({
          where: {
            memberId: member.id,
            status: "confirmed",
            date: { gte: weekStart, lt: weekEnd },
          },
        });
        if (weeklyCount >= sessionsPerWeek) {
          throw new PortalBookingError(400, `Tu plan permite ${sessionsPerWeek} clases por semana y ya alcanzaste el límite.`);
        }
      }

      const existing = await tx.scheduleBooking.findFirst({
        where: { slotId, memberId: member.id, date: targetDate },
      });
      if (existing) throw new PortalBookingError(400, "Ya tenés una reserva para esta clase.");

      const confirmedCount = await tx.scheduleBooking.count({
        where: { slotId, date: targetDate, status: "confirmed" },
      });
      if (confirmedCount >= slot.capacity) throw new PortalBookingError(400, "Cupo lleno");

      return tx.scheduleBooking.create({
        data: {
          tenantId: member.tenantId,
          slotId,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          date: targetDate,
        },
        include: { slot: true },
      });
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof PortalBookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: "Ya tenés una reserva para esta clase." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al reservar" }, { status: 500 });
  }
}
