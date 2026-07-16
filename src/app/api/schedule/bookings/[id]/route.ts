import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const booking = await prisma.scheduleBooking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.scheduleBooking.update({
    where: { id },
    data: { status: body.status || undefined },
    include: { slot: true },
  });

  return NextResponse.json(updated);
}
