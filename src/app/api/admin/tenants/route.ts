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

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    // Check if tenant with this email already exists
    const existing = await prisma.tenant.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un tenant con este email" }, { status: 409 });
    }

    const slug = email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        email,
        settings: {
          create: {
            businessName: name,
            businessEmail: email,
          },
        },
      },
    });

    // Activate default modules (bookings + staff)
    const modules = await prisma.module.findMany({
      where: { key: { in: ["bookings", "staff"] } },
    });
    if (modules.length > 0) {
      await prisma.tenantModule.createMany({
        data: modules.map((m) => ({
          tenantId: tenant.id,
          moduleId: m.id,
          active: true,
        })),
      });
    }

    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al crear tenant" }, { status: 500 });
  }
}
