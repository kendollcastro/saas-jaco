import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;

  const [bookings, members, products, sales, services] = await Promise.all([
    // Monthly bookings (last 12 months)
    prisma.booking.groupBy({
      by: ["date"],
      where: { tenantId, date: { gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1) } },
      _count: { id: true },
      _sum: { total: true },
    }),

    // Members by status
    prisma.member.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),

    // Top products
    prisma.saleItem.groupBy({
      by: ["productName"],
      where: { sale: { tenantId } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),

    // Monthly sales (last 12 months)
    prisma.sale.groupBy({
      by: ["createdAt"],
      where: { tenantId, createdAt: { gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1) } },
      _sum: { total: true },
      _count: { id: true },
    }),

    // Services with booking count
    prisma.service.findMany({
      where: { tenantId },
      include: { _count: { select: { bookings: true } } },
    }),
  ]);

  // Aggregate monthly revenue
  const monthlyMap = new Map<string, { revenue: number; bookings: number; sales: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { revenue: 0, bookings: 0, sales: 0 });
  }

  for (const b of bookings) {
    const key = `${b.date.getFullYear()}-${String(b.date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.get(key)!.bookings += b._count.id;
      monthlyMap.get(key)!.revenue += b._sum.total || 0;
    }
  }

  for (const s of sales) {
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.get(key)!.sales += s._sum.total || 0;
      monthlyMap.get(key)!.revenue += s._sum.total || 0;
    }
  }

  const monthlyRevenue = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .reverse();

  const membersByStatus = members.map((m) => ({ status: m.status, count: m._count.id }));
  const topProducts = products.map((p) => ({ name: p.productName, quantity: p._sum.quantity || 0, total: p._sum.total || 0 }));
  const servicesData = services.map((s) => ({ name: s.name, bookings: s._count.bookings, price: s.price }));

  // Raw data for CSV exports
  const allBookings = await prisma.booking.findMany({
    where: { tenantId },
    orderBy: { date: "desc" },
    take: 500,
    include: { service: { select: { name: true } }, staff: { select: { name: true } } },
  });

  const allMembers = await prisma.member.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const allProducts = await prisma.product.findMany({
    where: { tenantId, active: true },
    orderBy: { name: "asc" },
  });

  const allSales = await prisma.sale.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: true, member: { select: { name: true } } },
  });

  return NextResponse.json({
    monthlyRevenue,
    membersByStatus,
    topProducts,
    servicesData,
    csv: {
      bookings: allBookings.map((b) => [
        b.customerName, b.customerPhone || "", b.serviceName, b.date.toISOString().split("T")[0],
        b.status, String(b.total || ""), b.staff?.name || "",
      ]),
      members: allMembers.map((m) => [
        m.name, m.phone || "", m.email || "", m.membership, m.status,
        m.startDate.toISOString().split("T")[0], m.endDate?.toISOString().split("T")[0] || "",
      ]),
      products: allProducts.map((p) => [
        p.name, p.barcode || "", String(p.price), String(p.cost || ""), String(p.stock), p.category,
      ]),
      sales: allSales.map((s) => [
        new Date(s.createdAt).toISOString().split("T")[0],
        s.member?.name || "General", String(s.total), s.method, s.status,
        s.items.map((i) => `${i.productName}x${i.quantity}`).join(" / "),
      ]),
    },
  });
}
