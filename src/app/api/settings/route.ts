import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { AVAILABLE_MODULES } from "@/lib/modules";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sync modules from code into DB
  for (const mod of AVAILABLE_MODULES) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: { name: mod.name, description: mod.description, price: mod.price },
      create: { key: mod.key, name: mod.name, description: mod.description, price: mod.price },
    });
  }

  // Auto-create TenantModule records for any missing modules (inactive by default)
  const allDbModules = await prisma.module.findMany();
  const existingTM = await prisma.tenantModule.findMany({
    where: { tenantId: apiUser.tenantId },
  });
  const existingKeys = new Set(existingTM.map((tm) => tm.moduleId));
  const missing = allDbModules.filter((m) => !existingKeys.has(m.id));
  if (missing.length > 0) {
    await prisma.tenantModule.createMany({
      data: missing.map((m) => ({ tenantId: apiUser.tenantId, moduleId: m.id, active: false })),
    });
  }

  const [settings, modules, tenant] = await Promise.all([
    prisma.tenantSetting.findUnique({ where: { tenantId: apiUser.tenantId } }),
    prisma.tenantModule.findMany({
      where: { tenantId: apiUser.tenantId },
      include: { module: true },
    }),
    prisma.tenant.findUnique({ where: { id: apiUser.tenantId } }),
  ]);

  return NextResponse.json({
    businessName: settings?.businessName || tenant?.name || "",
    businessPhone: settings?.businessPhone || "",
    businessEmail: settings?.businessEmail || "",
    address: settings?.address || "",
    // Tax fields
    legalId: settings?.legalId || "",
    legalName: settings?.legalName || "",
    taxPhone: settings?.taxPhone || "",
    taxEmail: settings?.taxEmail || "",
    district: settings?.district || "",
    canton: settings?.canton || "",
    province: settings?.province || "",
    zipCode: settings?.zipCode || "",
    barrio: settings?.barrio || "",
    invoiceActivity: settings?.invoiceActivity || "",
    sinpePhone: settings?.sinpePhone || "",
    sinpeName: settings?.sinpeName || "",
    colorPrimary: settings?.colorPrimary || "#1e40af",
    logoUrl: settings?.logoUrl || "",
    themePreset: settings?.themePreset || "default",
    bookingNavLabel: settings?.bookingNavLabel || null,
    advanceNoticeHours: settings?.advanceNoticeHours ?? 2,
    extraClassPrice: settings?.extraClassPrice ?? 3000,
    modules: modules.map((m) => ({
      key: m.module.key,
      name: m.module.name,
      active: m.active,
    })),
  });
}

export async function PUT(request: Request) {
  try {
    const apiUser = await getApiUser();
    if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const data = {
      businessName: body.businessName || null,
      businessPhone: body.businessPhone || null,
      businessEmail: body.businessEmail || null,
      address: body.address || null,
      legalId: body.legalId || null,
      legalName: body.legalName || null,
      taxPhone: body.taxPhone || null,
      taxEmail: body.taxEmail || null,
      district: body.district || null,
      canton: body.canton || null,
      province: body.province || null,
      zipCode: body.zipCode || null,
      barrio: body.barrio || null,
      invoiceActivity: body.invoiceActivity || null,
      sinpePhone: body.sinpePhone || null,
      sinpeName: body.sinpeName || null,
      colorPrimary: body.colorPrimary || "#1e40af",
      logoUrl: body.logoUrl || null,
      themePreset: body.themePreset || "default",
      bookingNavLabel: body.bookingNavLabel || null,
      advanceNoticeHours: body.advanceNoticeHours != null ? Number(body.advanceNoticeHours) : 2,
      extraClassPrice: body.extraClassPrice != null ? Number(body.extraClassPrice) : 3000,
    };

    await prisma.tenantSetting.upsert({
      where: { tenantId: apiUser.tenantId },
      update: data,
      create: { tenantId: apiUser.tenantId, ...data },
    });

  // Update tenant modules
  if (body.modules) {
    const existingModules = await prisma.tenantModule.findMany({
      where: { tenantId: apiUser.tenantId },
      include: { module: true },
    });

    for (const mod of body.modules) {
      const dbModule = await prisma.module.findUnique({ where: { key: mod.key } });
      if (!dbModule) continue;

      const existing = existingModules.find((m) => m.module.key === mod.key);
      if (existing) {
        if (existing.active !== mod.active) {
          await prisma.tenantModule.update({
            where: { id: existing.id },
            data: { active: mod.active },
          });
        }
      } else if (mod.active) {
        await prisma.tenantModule.create({
          data: { tenantId: apiUser.tenantId, moduleId: dbModule.id, active: true },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
