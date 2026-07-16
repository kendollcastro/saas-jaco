import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalTenant } from "@/lib/portal-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const tenant = await getPortalTenant(slug);
    const slots = await prisma.scheduleSlot.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(slots);
  } catch {
    return NextResponse.json({ error: "Error al cargar horarios" }, { status: 500 });
  }
}
