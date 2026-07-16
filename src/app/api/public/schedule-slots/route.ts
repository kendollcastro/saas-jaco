import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tenant = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
  if (!tenant) return NextResponse.json([]);

  const slots = await prisma.scheduleSlot.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}
