import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const slot = await prisma.scheduleSlot.findFirst({ where: { id, tenantId: apiUser.tenantId } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  const updated = await prisma.scheduleSlot.update({
    where: { id },
    data: {
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      capacity: body.capacity,
      active: body.active,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const slot = await prisma.scheduleSlot.findFirst({ where: { id, tenantId: apiUser.tenantId } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.scheduleSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
