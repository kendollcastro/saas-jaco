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
  if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, endTime requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.create({
    data: {
      tenantId: apiUser.tenantId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      capacity: body.capacity || 10,
      active: body.active !== false,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
