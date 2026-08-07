import { prisma } from "./prisma";

export async function getTenantBranding(tenantId: string) {
  const [settings, tenant] = await Promise.all([
    prisma.tenantSetting.findUnique({ where: { tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  const businessName = settings?.businessName || tenant?.name || "";
  return {
    businessName,
    logoUrl: settings?.logoUrl || "",
    colorPrimary: settings?.colorPrimary || "#1e40af",
    themePreset: settings?.themePreset || "default",
  };
}
