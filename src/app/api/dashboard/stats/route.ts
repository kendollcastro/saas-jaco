import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    settings,
    todayBookings,
    monthBookings,
    monthRevenue,
    activeMembers,
    todayAttendance,
    totalMembers,
    newThisMonth,
    expiringCount,
    expiringMembers,
    expiredCount,
    todaySalesTotal,
    todayCheckins,
  ] = await Promise.all([
    prisma.tenantSetting.findUnique({ where: { tenantId: apiUser.tenantId }, select: { businessType: true } }),
    prisma.booking.count({ where: { tenantId: apiUser.tenantId, date: { gte: today, lte: todayEnd } } }),
    prisma.booking.count({ where: { tenantId: apiUser.tenantId, date: { gte: startOfMonth } } }),
    prisma.booking.aggregate({ where: { tenantId: apiUser.tenantId, date: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId, status: "active" } }),
    prisma.attendance.count({ where: { tenantId: apiUser.tenantId, dateIn: { gte: today, lte: todayEnd } } }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId } }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId, createdAt: { gte: startOfMonth } } }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId, endDate: { gte: today, lte: sevenDaysFromNow }, status: "active" } }),
    prisma.member.findMany({
      where: { tenantId: apiUser.tenantId, endDate: { gte: today, lte: sevenDaysFromNow }, status: "active" },
      select: { name: true, endDate: true, phone: true },
      orderBy: { endDate: "asc" },
      take: 5,
    }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId, status: "active", endDate: { lt: today } } }),
    prisma.sale.aggregate({ where: { tenantId: apiUser.tenantId, createdAt: { gte: today, lte: todayEnd } }, _sum: { total: true } }),
    prisma.attendance.findMany({
      where: { tenantId: apiUser.tenantId, dateIn: { gte: today, lte: todayEnd } },
      include: { member: { select: { name: true } } },
      orderBy: { dateIn: "desc" },
      take: 5,
    }),
    prisma.scheduleSlot.count({
      where: { tenantId: apiUser.tenantId, dayOfWeek: today.getDay(), active: true },
    }),
  ]);

  return NextResponse.json({
    businessType: settings?.businessType || "tourism",
    todayBookings,
    monthBookings,
    monthRevenue: monthRevenue._sum.total || 0,
    activeMembers,
    todayAttendance,
    totalMembers,
    newThisMonth,
    expiringCount,
    expiringMembers,
    expiredCount,
    todaySales: todaySalesTotal._sum.total || 0,
    todayCheckins: todayCheckins.map((a) => ({
      name: a.member?.name || "Desconocido",
      time: a.dateIn.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }),
    })),
  });
}
