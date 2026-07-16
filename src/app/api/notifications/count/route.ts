import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const members = await prisma.member.findMany({
    where: { tenantId: apiUser.tenantId, status: "active" },
    select: { endDate: true, lastNotifiedAt: true },
  });

  const expiringSoon = members.filter((m) => {
    if (!m.endDate) return false;
    const end = new Date(m.endDate);
    end.setHours(0, 0, 0, 0);
    return end >= now && end <= in7Days && !m.lastNotifiedAt;
  });

  const expired = await prisma.member.count({
    where: { tenantId: apiUser.tenantId, status: { not: "cancelled" }, endDate: { lt: now }, lastNotifiedAt: null },
  });

  return NextResponse.json({ count: expiringSoon.length + expired });
}
