import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { service: true, staff: true },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.customerName || !body.serviceName || !body.date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: {
      tenantId: apiUser.tenantId,
      customerName: body.customerName,
      customerPhone: body.customerPhone || null,
      customerEmail: body.customerEmail || null,
      serviceName: body.serviceName,
      date: new Date(body.date),
      time: body.time || null,
      pax: body.pax || 1,
      total: body.total ? parseFloat(body.total) : null,
      deposit: body.deposit ? parseFloat(body.deposit) : null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
