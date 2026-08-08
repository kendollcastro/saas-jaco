import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      tenant: {
        select: {
          settings: { select: { businessName: true, sinpePhone: true, sinpeName: true, logoUrl: true } },
        },
      },
      member: { select: { name: true } },
    },
  });

  if (!link) return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
  if (link.status !== "pending") return NextResponse.json({ error: "Link ya fue completado" }, { status: 410 });
  if (link.expiresAt && link.expiresAt < new Date()) return NextResponse.json({ error: "Link expirado" }, { status: 410 });

  return NextResponse.json({
    amount: link.amount,
    concept: link.concept,
    memberName: link.member.name,
    businessName: link.tenant.settings?.businessName || "",
    sinpePhone: link.tenant.settings?.sinpePhone || "",
    sinpeName: link.tenant.settings?.sinpeName || "",
    logoUrl: link.tenant.settings?.logoUrl || "",
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();

  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: { tenant: { select: { id: true } } },
  });

  if (!link) return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
  if (link.status !== "pending") return NextResponse.json({ error: "Link ya fue completado" }, { status: 410 });

  const { method, receiptUrl, sinpeRef } = body;

  const payment = await prisma.memberPayment.create({
    data: {
      tenantId: link.tenantId,
      memberId: link.memberId,
      amount: link.amount,
      method: method || "sinpe",
      notes: link.concept,
      receiptUrl: receiptUrl || null,
      sinpeRef: sinpeRef || null,
      periodTo: new Date(),
    },
  });

  try {
    await prisma.$transaction([
      prisma.paymentLink.update({
        where: { id: link.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          memberPaymentId: payment.id,
        },
      }),
      // If the link was generated for an extra-class booking, confirm it
      ...(link.scheduleBookingId
        ? [
            prisma.scheduleBooking.update({
              where: { id: link.scheduleBookingId },
              data: { status: "confirmed" },
            }),
          ]
        : []),
    ]);
  } catch (e) {
    // Roll back the payment so a failed link update can't leave orphan data
    await prisma.memberPayment.delete({ where: { id: payment.id } }).catch(() => {});
    throw e;
  }

  return NextResponse.json({ success: true, paymentId: payment.id });
}
