import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const tenantId = url.searchParams.get("tenantId");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) where.type = type;
  if (tenantId) where.tenantId = tenantId;

  const [events, total] = await Promise.all([
    prisma.platformEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { tenant: { select: { name: true } } },
    }),
    prisma.platformEvent.count({ where }),
  ]);

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      description: e.description,
      tenantName: e.tenant?.name ?? null,
      createdAt: e.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
