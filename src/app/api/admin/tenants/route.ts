import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, bookings: true, members: true } },
      modules: {
        include: { module: true },
        where: { active: true },
      },
    },
  });

  return NextResponse.json(
    tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      plan: t.plan,
      active: t.active,
      createdAt: t.createdAt,
      users: t._count.users,
      bookings: t._count.bookings,
      members: t._count.members,
      activeModules: t.modules.map((m) => ({ key: m.module.key, name: m.module.name })),
    }))
  );
}
