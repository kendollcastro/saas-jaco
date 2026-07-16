import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalTenants, activeTenants, totalUsers, totalModules, totalMembers, totalBookings, totalSales] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { active: true } }),
      prisma.user.count(),
      prisma.tenantModule.count({ where: { active: true } }),
      prisma.member.count(),
      prisma.booking.count(),
      prisma.sale.aggregate({ _sum: { total: true } }),
    ]);

  return NextResponse.json({
    totalTenants,
    activeTenants,
    totalUsers,
    totalModules,
    totalMembers,
    totalBookings,
    totalRevenue: totalSales._sum.total || 0,
  });
}
