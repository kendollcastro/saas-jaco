import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { bookingSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/phone";

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
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { customerName, customerPhone, customerEmail, serviceName, date, time, pax, total, deposit, notes } = parsed.data;

  const booking = await prisma.booking.create({
    data: {
      tenantId: apiUser.tenantId,
      customerName,
      customerPhone: normalizePhone(customerPhone),
      customerEmail: customerEmail || null,
      serviceName,
      date: new Date(date),
      time: time || null,
      pax: pax ?? 1,
      total: total ?? null,
      deposit: deposit ?? null,
      notes: notes || null,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
