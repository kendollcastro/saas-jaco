import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!member) {
    return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  if (!body.amount) {
    return NextResponse.json({ error: "Monto requerido" }, { status: 400 });
  }

  await prisma.memberPayment.create({
    data: {
      tenantId: apiUser.tenantId,
      memberId: id,
      amount: parseFloat(body.amount),
      method: body.method || "efectivo",
      notes: body.notes || null,
      sinpeRef: body.sinpeRef || null,
    },
  });

  // Extend end date from current endDate (or today if expired)
  const baseDate = member.endDate && member.endDate > new Date() ? new Date(member.endDate) : new Date();
  let endDate = new Date(baseDate);
  if (member.membership === "mensual") endDate.setMonth(endDate.getMonth() + 1);
  else if (member.membership === "trimestral") endDate.setMonth(endDate.getMonth() + 3);
  else if (member.membership === "semestral") endDate.setMonth(endDate.getMonth() + 6);
  else if (member.membership === "anual") endDate.setFullYear(endDate.getFullYear() + 1);

  await prisma.member.update({
    where: { id },
    data: { status: "active", endDate },
  });

  const updated = await prisma.member.findUnique({
    where: { id },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(updated, { status: 201 });
}
