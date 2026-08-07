import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalTenant } from "@/lib/portal-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let tenant;
  try {
    tenant = await getPortalTenant(searchParams.get("slug"));
  } catch {
    return NextResponse.json([]);
  }
  if (!tenant) return NextResponse.json([]);

  const slots = await prisma.scheduleSlot.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}
