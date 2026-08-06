import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { normalizePhone } from "@/lib/phone";
import type { Prisma } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  const data: Record<string, unknown> = {
    lastNotifiedAt: body.markNotified ? new Date() : undefined,
    status: body.status || undefined,
  };

  const profileFields = [
    "name", "phone", "email", "birthDate", "gender", "weightKg", "heightCm",
    "emergencyContact", "emergencyPhone", "medicalConditions", "objective", "notes",
  ] as const;
  for (const field of profileFields) {
    if (body[field] !== undefined) {
      if (field === "phone" || field === "emergencyPhone") {
        data[field] = body[field] ? normalizePhone(body[field]) : null;
      } else if (field === "birthDate") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else if (field === "weightKg" || field === "heightCm") {
        data[field] = body[field] ? parseFloat(body[field]) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  const updated = await prisma.member.update({
    where: { id },
    data: data as Prisma.MemberUpdateInput,
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 }, plan: true },
  });

  return NextResponse.json(updated);
}
