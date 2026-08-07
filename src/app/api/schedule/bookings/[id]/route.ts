import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const booking = await prisma.scheduleBooking.findFirst({ where: { id, tenantId: apiUser.tenantId } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.scheduleBooking.update({
    where: { id },
    data: { status: body.status || undefined },
    include: { slot: true },
  });

  return NextResponse.json(updated);
}
