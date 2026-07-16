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
      _count: { select: { users: true, bookings: true, members: true, services: true, products: true, sales: true, invoices: true } },
      modules: { include: { module: true } },
    },
  });

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...tenant,
    modules: tenant.modules.map((tm) => ({ key: tm.module.key, name: tm.module.name, active: tm.active })),
    stats: tenant._count,
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

  if (body.plan) {
    const tenant = await prisma.tenant.findUnique({ where: { id }, select: { name: true, plan: true } });
    if (tenant && tenant.plan !== body.plan) {
      await logEvent(
        "tenant.plan_changed",
        `Plan de "${tenant.name}" cambiado de "${tenant.plan}" a "${body.plan}"`,
        id
      );
    }
    await prisma.tenant.update({ where: { id }, data: { plan: body.plan } });

    // Auto-sync modules from plan
    const plan = await prisma.plan.findUnique({
      where: { slug: body.plan },
      include: { modules: true },
    });
    if (plan) {
      const planModuleIds = plan.modules.map((pm) => pm.moduleId);
      const allTenantModules = await prisma.tenantModule.findMany({
        where: { tenantId: id },
      });
      // Deactivate modules not in plan
      for (const tm of allTenantModules) {
        if (!planModuleIds.includes(tm.moduleId)) {
          await prisma.tenantModule.update({
            where: { id: tm.id },
            data: { active: false },
          });
        }
      }
      // Activate modules in plan
      for (const moduleId of planModuleIds) {
        const existing = allTenantModules.find((tm) => tm.moduleId === moduleId);
        if (existing) {
          if (!existing.active) {
            await prisma.tenantModule.update({
              where: { id: existing.id },
              data: { active: true },
            });
          }
        } else {
          await prisma.tenantModule.create({
            data: { tenantId: id, moduleId, active: true },
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
