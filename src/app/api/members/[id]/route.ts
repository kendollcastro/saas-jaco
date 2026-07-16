import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

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

  const updated = await prisma.member.update({
    where: { id },
    data: {
      lastNotifiedAt: body.markNotified ? new Date() : undefined,
      status: body.status || undefined,
    },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json(updated);
}
