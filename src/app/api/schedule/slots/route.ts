import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.scheduleSlot.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { _count: { select: { bookings: { where: { status: "confirmed" } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const days = Array.isArray(body.days)
    ? body.days
    : body.dayOfWeek !== undefined
    ? [body.dayOfWeek]
    : [];
  if (days.length === 0 || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "Seleccioná al menos un día, hora de inicio y fin" }, { status: 400 });
  }
  const validDays = days.filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (validDays.length === 0) {
    return NextResponse.json({ error: "Días inválidos" }, { status: 400 });
  }

  const existing = await prisma.scheduleSlot.findMany({
    where: { tenantId: apiUser.tenantId },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });
  const existingKeys = new Set(existing.map((s) => `${s.dayOfWeek}|${s.startTime}|${s.endTime}`));
  const toCreate = validDays.filter((d: number) => !existingKeys.has(`${d}|${body.startTime}|${body.endTime}`));

  if (toCreate.length > 0) {
    await prisma.scheduleSlot.createMany({
      data: toCreate.map((d: number) => ({
        tenantId: apiUser.tenantId,
        dayOfWeek: d,
        startTime: body.startTime,
        endTime: body.endTime,
        capacity: body.capacity || 10,
        active: body.active !== false,
      })),
    });
  }

  const slots = await prisma.scheduleSlot.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { _count: { select: { bookings: { where: { status: "confirmed" } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(
    { created: toCreate.length, skipped: validDays.length - toCreate.length, slots },
    { status: 201 }
  );
}
