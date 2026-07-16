import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await prisma.attendance.findMany({
    where: {
      tenantId: apiUser.tenantId,
      dateIn: { gte: today, lt: tomorrow },
    },
    include: { member: true },
    orderBy: { dateIn: "desc" },
  });

  return NextResponse.json(attendance);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.memberId) {
    return NextResponse.json({ error: "memberId requerido" }, { status: 400 });
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.attendance.findFirst({
    where: {
      tenantId: apiUser.tenantId,
      memberId: body.memberId,
      dateIn: { gte: today },
      dateOut: null,
    },
  });

  if (existing) {
    // Check out
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: { dateOut: new Date() },
      include: { member: true },
    });
    return NextResponse.json(updated);
  }

  // Check in
  const record = await prisma.attendance.create({
    data: {
      tenantId: apiUser.tenantId,
      memberId: body.memberId,
      dateIn: new Date(),
    },
    include: { member: true },
  });

  return NextResponse.json(record, { status: 201 });
}
