import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalMember } from "@/lib/portal-auth";

const periods: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };

export async function GET(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payments = await prisma.memberPayment.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(payments);
}

export async function POST(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { amount, method, receiptUrl, sinpeRef, notes, paidAt } = await request.json();
  if (!amount && !method) return NextResponse.json({ error: "Monto y método requeridos" }, { status: 400 });

  const paidDate = paidAt ? new Date(paidAt) : new Date();
  const months = periods[member.membership] || 1;
  const currentEnd = member.endDate && member.endDate > paidDate ? member.endDate : paidDate;
  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + months);

  const [payment] = await prisma.$transaction([
    prisma.memberPayment.create({
      data: {
        tenantId: member.tenantId,
        memberId: member.id,
        amount: amount || 0,
        method: method || "sinpe",
        receiptUrl: receiptUrl || null,
        sinpeRef: sinpeRef || null,
        notes: notes || null,
        periodFrom: paidDate,
        periodTo: newEnd,
      },
    }),
    prisma.member.update({
      where: { id: member.id },
      data: {
        endDate: newEnd,
        status: "active",
        startDate: member.status === "pending" ? paidDate : member.startDate,
      },
    }),
  ]);

  return NextResponse.json(payment, { status: 201 });
}
