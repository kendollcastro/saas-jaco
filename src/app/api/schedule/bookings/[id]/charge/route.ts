import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import crypto from "crypto";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const booking = await prisma.scheduleBooking.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!booking.memberId) return NextResponse.json({ error: "La reserva no tiene socio vinculado" }, { status: 400 });
  if (booking.status !== "pending") return NextResponse.json({ error: "La reserva no está pendiente de pago" }, { status: 400 });

  const settings = await prisma.tenantSetting.findUnique({ where: { tenantId: apiUser.tenantId } });
  const price = settings?.extraClassPrice ?? 3000;

  const token = crypto.randomBytes(24).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL || "olasaas.vercel.app"}`;

  const link = await prisma.paymentLink.create({
    data: {
      tenantId: apiUser.tenantId,
      memberId: booking.memberId,
      token,
      amount: price,
      concept: "Clase extra",
      status: "pending",
      scheduleBookingId: booking.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    url: `${baseUrl}/pay/${link.token}`,
    amount: link.amount,
    concept: link.concept,
  });
}
