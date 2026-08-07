import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { syncUser } from "@/lib/auth";
import { getTenantBranding } from "@/lib/tenant-brand";
import DashboardShell, { DashboardSettings } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let apiUser = null;
  try {
    apiUser = await getApiUser();
  } catch {
    apiUser = null;
  }

  if (!apiUser) {
    return { title: "Ola Saas" };
  }

  const branding = await getTenantBranding(apiUser.tenantId);
  return {
    title: branding.businessName || "Ola Saas",
    icons: {
      icon: "/api/tenant-icon",
      shortcut: "/api/tenant-icon",
    },
  };
}

const emptyInitial: DashboardSettings = {
  businessName: "",
  logoUrl: "",
  bookingNavLabel: null,
  themePreset: "default",
  colorPrimary: "#1e40af",
  activeModuleKeys: [],
  maintenance: { enabled: false, message: "" },
  onboarding: null,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let apiUser = null;
  try {
    apiUser = await getApiUser();
  } catch {
    apiUser = null;
  }

  // Self-heal: session exists but user/tenant not yet created in DB
  // (e.g. if the email/sync step failed on signup). Ensure the record exists.
  if (!apiUser) {
    try {
      await syncUser();
      apiUser = await getApiUser();
    } catch {
      apiUser = null;
    }
  }

  let initial = emptyInitial;

  if (apiUser) {
    try {
      const [settings, modules, tenant, maintenanceConfig, services, staff, slots, members] = await Promise.all([
        prisma.tenantSetting.findUnique({ where: { tenantId: apiUser.tenantId } }),
        prisma.tenantModule.findMany({
          where: { tenantId: apiUser.tenantId },
          include: { module: true },
        }),
        prisma.tenant.findUnique({ where: { id: apiUser.tenantId } }),
        prisma.platformConfig.findUnique({ where: { key: "maintenance" } }),
        prisma.service.count({ where: { tenantId: apiUser.tenantId } }),
        prisma.staff.count({ where: { tenantId: apiUser.tenantId } }),
        prisma.scheduleSlot.count({ where: { tenantId: apiUser.tenantId } }),
        prisma.member.count({ where: { tenantId: apiUser.tenantId } }),
      ]);

      const maint = (maintenanceConfig?.value as { enabled?: boolean; message?: string }) || {};
      initial = {
        businessName: settings?.businessName || tenant?.name || "",
        logoUrl: settings?.logoUrl || "",
        bookingNavLabel: settings?.bookingNavLabel || null,
        themePreset: settings?.themePreset || "default",
        colorPrimary: settings?.colorPrimary || "#1e40af",
        activeModuleKeys: modules.filter((m) => m.active).map((m) => m.module.key),
        maintenance: { enabled: maint.enabled || false, message: maint.message || "" },
        onboarding: {
          needsOnboarding: !settings?.onboardingDone,
          progress: {
            services: services > 0,
            staff: staff > 0,
            schedule: slots > 0,
            members: members > 0,
          },
        },
      };
    } catch (e) {
      console.error("Dashboard layout settings fetch failed:", e);
    }
  }

  return <DashboardShell initial={initial}>{children}</DashboardShell>;
}
