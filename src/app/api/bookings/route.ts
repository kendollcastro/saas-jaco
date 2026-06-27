import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { service: true, staff: true },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const tenantId = "TENANT_ID_PLACEHOLDER";

  const booking = await prisma.booking.create({
    data: {
      tenantId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      serviceName: body.serviceName,
      date: new Date(body.date),
      time: body.time,
      pax: body.pax || 1,
      total: body.total ? parseFloat(body.total) : null,
      deposit: body.deposit ? parseFloat(body.deposit) : null,
      notes: body.notes,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
