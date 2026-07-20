import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { id, tenantId: apiUser.tenantId },
    include: { plan: true },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const baseDate = member.endDate && member.endDate > now ? member.endDate : now;

  let newEndDate: Date;
  if (member.plan) {
    newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + member.plan.durationDays);
  } else {
    // Legacy: extend 1 month
    newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);
  }

  const updated = await prisma.member.update({
    where: { id },
    data: {
      endDate: newEndDate,
      status: "active",
    },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 }, plan: true },
  });

  return NextResponse.json(updated);
}
