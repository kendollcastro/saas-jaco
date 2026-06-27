import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.tenantSetting.findUnique({
    where: { tenantId: apiUser.tenantId },
  });

  const modules = await prisma.tenantModule.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { module: true },
  });

  return NextResponse.json({
    settings,
    modules: modules.map((m) => ({
      key: m.module.key,
      name: m.module.name,
      active: m.active,
    })),
  });
}

export async function PUT(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const settings = await prisma.tenantSetting.upsert({
    where: { tenantId: apiUser.tenantId },
    update: {
      businessName: body.businessName ?? undefined,
      businessPhone: body.businessPhone ?? undefined,
      businessEmail: body.businessEmail ?? undefined,
      address: body.address ?? undefined,
    },
    create: {
      tenantId: apiUser.tenantId,
      businessName: body.businessName,
      businessPhone: body.businessPhone,
      businessEmail: body.businessEmail,
      address: body.address,
    },
  });

  if (body.modules) {
    for (const mod of body.modules) {
      const module = await prisma.module.findUnique({ where: { key: mod.key } });
      if (module) {
        await prisma.tenantModule.upsert({
          where: { tenantId_moduleId: { tenantId: apiUser.tenantId, moduleId: module.id } },
          update: { active: mod.active },
          create: { tenantId: apiUser.tenantId, moduleId: module.id, active: mod.active },
        });
      }
    }
  }

  return NextResponse.json({ settings });
}
