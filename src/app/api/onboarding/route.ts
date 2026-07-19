import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, services, staff, slots, members] = await Promise.all([
    prisma.tenantSetting.findUnique({ where: { tenantId: apiUser.tenantId } }),
    prisma.service.count({ where: { tenantId: apiUser.tenantId } }),
    prisma.staff.count({ where: { tenantId: apiUser.tenantId } }),
    prisma.scheduleSlot.count({ where: { tenantId: apiUser.tenantId } }),
    prisma.member.count({ where: { tenantId: apiUser.tenantId } }),
  ]);

  const needsOnboarding = !settings?.onboardingDone;

  return NextResponse.json({
    needsOnboarding,
    progress: {
      services: services > 0,
      staff: staff > 0,
      schedule: slots > 0,
      members: members > 0,
    },
  });
}

export async function POST() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.tenantSetting.upsert({
    where: { tenantId: apiUser.tenantId },
    update: { onboardingDone: true },
    create: { tenantId: apiUser.tenantId, onboardingDone: true },
  });

  return NextResponse.json({ success: true });
}
