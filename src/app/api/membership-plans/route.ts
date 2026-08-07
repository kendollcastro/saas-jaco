import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId: apiUser.tenantId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, price, durationDays, sessionsPerWeek } = body;

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: apiUser.tenantId,
        name,
        description: description || null,
        price: Number(price) || 0,
        durationDays: Number(durationDays) || 30,
        sessionsPerWeek: sessionsPerWeek != null && Number(sessionsPerWeek) > 0 ? Number(sessionsPerWeek) : null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}
