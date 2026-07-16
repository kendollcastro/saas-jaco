import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const slotId = searchParams.get("slotId");

  const where: any = { tenantId: apiUser.tenantId };
  if (date) where.date = new Date(date);
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }
  if (slotId) where.slotId = slotId;

  const bookings = await prisma.scheduleBooking.findMany({
    where,
    include: { slot: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.slotId || !body.memberName || !body.date) {
    return NextResponse.json({ error: "slotId, memberName, date requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.findUnique({
    where: { id: body.slotId },
    include: { _count: { select: { bookings: { where: { date: new Date(body.date), status: "confirmed" } } } } },
  });

  if (!slot) return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  if (slot.tenantId !== apiUser.tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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
      notes: body.notes || null,
    },
    include: { slot: true },
  });

  return NextResponse.json(booking, { status: 201 });
}
