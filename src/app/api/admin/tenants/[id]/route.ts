import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      settings: true,
      _count: { select: { users: true, bookings: true, members: true, services: true, products: true, sales: true, invoices: true } },
      modules: { include: { module: true } },
    },
  });

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { settings, modules, _count, ...rest } = tenant;
  return NextResponse.json({
    ...rest,
    settings: settings ? { businessType: settings.businessType, category: settings.category } : null,
    modules: modules.map((tm) => ({ key: tm.module.key, name: tm.module.name, active: tm.active })),
    stats: _count,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.active !== undefined) {
    const old = await prisma.tenant.findUnique({ where: { id }, select: { name: true, active: true } });
    await prisma.tenant.update({ where: { id }, data: { active: body.active } });
    if (old && old.active !== body.active) {
      await logEvent(
        body.active ? "tenant.activated" : "tenant.suspended",
        `Tenant "${old.name}" ${body.active ? "activado" : "suspendido"}`,
        id
      );
    }
  }

  if (body.modules) {
    for (const mod of body.modules) {
      const dbModule = await prisma.module.findUnique({ where: { key: mod.key } });
      if (!dbModule) continue;
      await prisma.tenantModule.upsert({
        where: { tenantId_moduleId: { tenantId: id, moduleId: dbModule.id } },
        update: { active: mod.active },
        create: { tenantId: id, moduleId: dbModule.id, active: mod.active },
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tenant.delete({ where: { id } });

  await logEvent(
    "tenant.deleted",
    `Tenant "${tenant.name}" eliminado por super admin`,
  );

  return NextResponse.json({ success: true });
}
