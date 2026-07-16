import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await req.json();
  const { name, slug, description, price, interval, active, sortOrder, moduleKeys } = json;

  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (slug && slug !== plan.slug) {
    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(interval !== undefined && { interval }),
      ...(active !== undefined && { active }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  // Sync plan modules
  if (moduleKeys !== undefined) {
    const modules = moduleKeys.length
      ? await prisma.module.findMany({ where: { key: { in: moduleKeys } } })
      : [];
    const newIds = modules.map((m) => m.id);

    await prisma.planModule.deleteMany({
      where: { planId: id, moduleId: { notIn: newIds } },
    });
    for (const moduleId of newIds) {
      await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: id, moduleId } },
        update: {},
        create: { planId: id, moduleId },
      });
    }
  }

  return NextResponse.json({ id: updated.id, name: updated.name, slug: updated.slug });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tenantCount = await prisma.tenant.count({ where: { plan: (await prisma.plan.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? "" } });
  // we can't easily check by slug like this without fetching first
  const plan = await prisma.plan.findUnique({ where: { id }, select: { slug: true } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const usingTenants = await prisma.tenant.count({ where: { plan: plan.slug } });
  if (usingTenants > 0) {
    return NextResponse.json({ error: `Cannot delete: ${usingTenants} tenant(s) are using this plan` }, { status: 400 });
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
