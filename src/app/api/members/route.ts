import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { normalizePhone } from "@/lib/phone";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 }, plan: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  let endDate: Date | null = null;
  let planId = body.planId || null;

  if (planId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (plan) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationDays);
    } else {
      planId = null;
    }
  }

  if (!endDate) {
    if (body.membership === "mensual") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (body.membership === "trimestral") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (body.membership === "semestral") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (body.membership === "anual") {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
  }

  const member = await prisma.member.create({
    data: {
      tenantId: apiUser.tenantId,
      name: body.name,
      phone: normalizePhone(body.phone),
      email: body.email || null,
      membership: body.membership || "mensual",
      planId,
      startDate,
      endDate,
      notes: body.notes || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender || null,
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
      emergencyContact: body.emergencyContact || null,
      emergencyPhone: body.emergencyPhone ? normalizePhone(body.emergencyPhone) : null,
      medicalConditions: body.medicalConditions || null,
      objective: body.objective || null,
    },
    include: { payments: true, plan: true },
  });

  // Create initial payment if amount provided
  if (body.amount) {
    await prisma.memberPayment.create({
      data: {
        tenantId: apiUser.tenantId,
        memberId: member.id,
        amount: parseFloat(body.amount),
        method: body.paymentMethod || "efectivo",
        periodFrom: startDate,
        periodTo: endDate,
        notes: "Pago inicial",
        sinpeRef: body.sinpeRef || null,
      },
    });
  }

  const updated = await prisma.member.findUnique({
    where: { id: member.id },
    include: { payments: { orderBy: { createdAt: "desc" } }, plan: true },
  });

  return NextResponse.json(updated, { status: 201 });
}
