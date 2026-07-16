import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [recentTenants, recentBookings, recentSales, recentMembers] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, slug: true, createdAt: true } }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { tenant: { select: { name: true } } } }),
    prisma.sale.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { tenant: { select: { name: true } } } }),
    prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { tenant: { select: { name: true } } } }),
  ]);

  const activities: { type: string; description: string; time: string; tenantName: string }[] = [
    ...recentTenants.map((t) => ({ type: "tenant" as const, description: `Nuevo tenant: ${t.name}`, time: t.createdAt.toISOString(), tenantName: t.name })),
    ...recentBookings.map((b) => ({ type: "booking" as const, description: `Reserva de ${b.customerName}`, time: b.createdAt.toISOString(), tenantName: b.tenant.name })),
    ...recentSales.map((s) => ({ type: "sale" as const, description: `Venta por $${s.total.toFixed(2)}`, time: s.createdAt.toISOString(), tenantName: s.tenant.name })),
    ...recentMembers.map((m) => ({ type: "member" as const, description: `Nuevo socio: ${m.name}`, time: m.createdAt.toISOString(), tenantName: m.tenant.name })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 15);

  return NextResponse.json(activities);
}
