import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    todayBookings,
    monthBookings,
    monthRevenue,
    activeMembers,
    todayAttendance,
    totalMembers,
  ] = await Promise.all([
    prisma.booking.count({
      where: { tenantId: apiUser.tenantId, date: { gte: today, lte: todayEnd } },
    }),
    prisma.booking.count({
      where: { tenantId: apiUser.tenantId, date: { gte: startOfMonth } },
    }),
    prisma.booking.aggregate({
      where: { tenantId: apiUser.tenantId, date: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.member.count({
      where: { tenantId: apiUser.tenantId, status: "active" },
    }),
    prisma.attendance.count({
      where: { tenantId: apiUser.tenantId, dateIn: { gte: today, lte: todayEnd } },
    }),
    prisma.member.count({
      where: { tenantId: apiUser.tenantId },
    }),
  ]);

  return NextResponse.json({
    todayBookings,
    monthBookings,
    monthRevenue: monthRevenue._sum.total || 0,
    activeMembers,
    todayAttendance,
    totalMembers,
  });
}
