import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { items: true, booking: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(invoices);
}

function generateClave(tenantId: string, type: string, consecutive: string): string {
  const country = "506";
  const day = new Date().toISOString().slice(8, 10);
  const month = new Date().toISOString().slice(5, 7);
  const year = new Date().toISOString().slice(2, 4);
  // Base: 20 chars from tenantId padded
  const idPart = tenantId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).padEnd(10, "0");
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const raw = `${country}${day}${month}${year}${type}${consecutive.padStart(20, "0")}${idPart}${random}`;
  return raw.slice(0, 50).padEnd(50, "0");
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { bookingId, customerId, customerName, customerEmail, items } = body;

  if (!customerName || !items?.length) {
    return NextResponse.json({ error: "Faltan datos del cliente o items" }, { status: 400 });
  }

  // Get company tax info
  const settings = await prisma.tenantSetting.findUnique({
    where: { tenantId: apiUser.tenantId },
  });

  if (!settings?.legalId || !settings?.legalName) {
    return NextResponse.json({ error: "Configure los datos fiscales en Configuración primero" }, { status: 400 });
  }

  // Get or create sequence for this year
  const year = new Date().getFullYear();
  let seq = await prisma.invoiceSequence.findUnique({
    where: { tenantId_type_year: { tenantId: apiUser.tenantId, type: "FE", year } },
  });
  if (!seq) {
    seq = await prisma.invoiceSequence.create({
      data: { tenantId: apiUser.tenantId, type: "FE", year, currentNumber: 0 },
    });
  }

  const nextNum = seq.currentNumber + 1;
  const consecutive = `0010000101${String(nextNum).padStart(10, "0")}`;
  const clave = generateClave(apiUser.tenantId, "01", String(nextNum));

  // Calculate totals
  let subtotal = 0;
  let tax = 0;
  const invoiceItems = items.map((it: any, i: number) => {
    const itSubtotal = it.quantity * it.unitPrice;
    const itTax = itSubtotal * (it.taxRate || 13) / 100;
    subtotal += itSubtotal;
    tax += itTax;
    return {
      line: i + 1,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: itSubtotal,
      taxRate: it.taxRate || 13,
      tax: itTax,
      total: itSubtotal + itTax,
    };
  });

  const total = subtotal + tax;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: apiUser.tenantId,
      type: "FE",
      consecutive,
      clave,
      status: "draft",
      issuerName: settings.legalName,
      issuerId: settings.legalId,
      customerId: customerId || "000000000",
      customerName,
      customerEmail: customerEmail || null,
      subtotal,
      tax,
      total,
      bookingId: bookingId || null,
      items: { create: invoiceItems },
    },
    include: { items: true, booking: true },
  });

  // Update sequence
  await prisma.invoiceSequence.update({
    where: { id: seq.id },
    data: { currentNumber: nextNum },
  });

  return NextResponse.json(invoice, { status: 201 });
}
