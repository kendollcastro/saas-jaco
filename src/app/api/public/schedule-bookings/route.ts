import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalTenant } from "@/lib/portal-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let tenant;
  try {
    tenant = await getPortalTenant(searchParams.get("slug"));
  } catch {
    return NextResponse.json([]);
  }
  if (!tenant) return NextResponse.json([]);

  const bookings = await prisma.scheduleBooking.findMany({
    where: { tenantId: tenant.id, status: "confirmed" },
    select: { slotId: true, date: true, status: true },
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  let tenant;
  try {
    tenant = await getPortalTenant(searchParams.get("slug"));
  } catch {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const body = await request.json();

  if (!body.slotId || !body.memberName || !body.date) {
    return NextResponse.json({ error: "slotId, memberName, date requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.findUnique({
    where: { id: body.slotId },
    include: { _count: { select: { bookings: { where: { date: new Date(body.date), status: "confirmed" } } } } },
  });

  if (!slot) return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  if (slot.tenantId !== tenant.id) return NextResponse.json({ error: "Horario no disponible" }, { status: 400 });
  if (!slot.active) return NextResponse.json({ error: "Horario no disponible" }, { status: 400 });
  if (slot.dayOfWeek !== new Date(body.date).getUTCDay()) {
    return NextResponse.json({ error: "La fecha no corresponde al día del horario seleccionado" }, { status: 400 });
  }

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
