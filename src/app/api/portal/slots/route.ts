import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalTenant } from "@/lib/portal-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");
    const tenant = await getPortalTenant(slug);

    const slots = await prisma.scheduleSlot.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: date
        ? {
            bookings: {
              where: { date: new Date(date), status: "confirmed" },
              select: { id: true },
            },
          }
        : undefined,
    });

    const result = slots.map((s) => {
      const { bookings, ...rest } = s as { bookings?: { id: string }[] };
      return { ...rest, bookedCount: bookings?.length ?? 0 };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al cargar horarios" }, { status: 500 });
  }
}
