import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalMember } from "@/lib/portal-auth";

export async function GET(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const bookings = await prisma.scheduleBooking.findMany({
    where: { memberPhone: member.phone || undefined, tenantId: member.tenantId },
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

  const slot = await prisma.scheduleSlot.findUnique({
    where: { id: slotId },
    include: { _count: { select: { bookings: { where: { date: new Date(date), status: "confirmed" } } } } },
  });
  if (!slot || !slot.active) return NextResponse.json({ error: "Horario no disponible" }, { status: 400 });
  if (slot._count.bookings >= slot.capacity) return NextResponse.json({ error: "Cupo lleno" }, { status: 400 });

  const booking = await prisma.scheduleBooking.create({
    data: {
      tenantId: member.tenantId,
      slotId,
      memberName: member.name,
      memberPhone: member.phone,
      date: new Date(date),
    },
    include: { slot: true },
  });

  return NextResponse.json(booking, { status: 201 });
}
