import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import crypto from "crypto";

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { memberId, amount, concept } = body;
  if (!memberId || !amount) {
    return NextResponse.json({ error: "memberId y amount requeridos" }, { status: 400 });
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: apiUser.tenantId },
  });
  if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

  const token = crypto.randomBytes(24).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL || "saas-jaco.vercel.app"}`;

  const link = await prisma.paymentLink.create({
    data: {
      tenantId: apiUser.tenantId,
      memberId,
      token,
      amount: parseFloat(amount),
      concept: concept || "Pago de membresía",
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({
    token: link.token,
    url: `${baseUrl}/pay/${link.token}`,
    amount: link.amount,
    concept: link.concept,
  });
}
