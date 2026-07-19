import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const modules = await prisma.module.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json(modules.map((m) => ({ key: m.key, name: m.name, description: m.description })));
}
