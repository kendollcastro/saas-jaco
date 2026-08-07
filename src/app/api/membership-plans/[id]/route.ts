import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const plan = await prisma.membershipPlan.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.durationDays !== undefined) data.durationDays = Number(body.durationDays);
    if (body.sessionsPerWeek !== undefined)
      data.sessionsPerWeek = body.sessionsPerWeek != null && Number(body.sessionsPerWeek) > 0 ? Number(body.sessionsPerWeek) : null;
    if (body.active !== undefined) data.active = body.active;

    const updated = await prisma.membershipPlan.update({ where: { id }, data });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const plan = await prisma.membershipPlan.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.membershipPlan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
