import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      modules: {
        include: { module: true },
      },
    },
  });

  return NextResponse.json(plans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    interval: p.interval,
    active: p.active,
    sortOrder: p.sortOrder,
    moduleKeys: p.modules.map((pm) => pm.module.key),
    modules: p.modules.map((pm) => ({ key: pm.module.key, name: pm.module.name })),
    createdAt: p.createdAt,
  })));
}

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const { name, slug, description, price, interval, active, sortOrder, moduleKeys } = json;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const modules = moduleKeys?.length
    ? await prisma.module.findMany({ where: { key: { in: moduleKeys } } })
    : [];

  const plan = await prisma.plan.create({
    data: {
      name,
      slug,
      description,
      price: price ?? 0,
      interval: interval ?? "monthly",
      active: active ?? true,
      sortOrder: sortOrder ?? 0,
      modules: {
        create: modules.map((m) => ({ moduleId: m.id })),
      },
    },
    include: { modules: { include: { module: true } } },
  });

  return NextResponse.json({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    price: plan.price,
    interval: plan.interval,
    active: plan.active,
    sortOrder: plan.sortOrder,
    moduleKeys: plan.modules.map((pm) => pm.module.key),
  });
}
