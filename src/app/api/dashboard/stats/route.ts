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

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayCount, monthCount, revenue] = await Promise.all([
    prisma.booking.count({
      where: { tenantId: apiUser.tenantId, date: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: { tenantId: apiUser.tenantId, createdAt: { gte: monthStart } },
    }),
    prisma.booking.aggregate({
      where: { tenantId: apiUser.tenantId, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    todayBookings: todayCount,
    monthBookings: monthCount,
    monthRevenue: revenue._sum.total ?? 0,
  });
}
