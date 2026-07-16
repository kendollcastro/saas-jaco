import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tenant = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
  if (!tenant) return NextResponse.json([]);

  const bookings = await prisma.scheduleBooking.findMany({
    where: { tenantId: tenant.id, status: "confirmed" },
    select: { slotId: true, date: true, status: true },
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.slotId || !body.memberName || !body.date) {
    return NextResponse.json({ error: "slotId, memberName, date requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.findUnique({
    where: { id: body.slotId },
    include: { _count: { select: { bookings: { where: { date: new Date(body.date), status: "confirmed" } } } } },
  });

  if (!slot) return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  if (!slot.active) return NextResponse.json({ error: "Horario no disponible" }, { status: 400 });

  if (slot._count.bookings >= slot.capacity) {
    return NextResponse.json({ error: "Cupo lleno" }, { status: 400 });
  }

  const booking = await prisma.scheduleBooking.create({
    data: {
      tenantId: slot.tenantId,
      slotId: body.slotId,
      memberName: body.memberName,
      memberPhone: body.memberPhone || null,
      memberEmail: body.memberEmail || null,
      date: new Date(body.date),
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
