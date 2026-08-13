import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { tenantId: apiUser.tenantId },
    include: {
      items: true,
      expenses: true,
      client: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withTotals = projects.map((p) => {
    const cotizacion = p.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const gastos = p.expenses.reduce((sum, e) => sum + e.amount, 0);
    return { ...p, cotizacionTotal: cotizacion, gastosTotal: gastos, ganancia: cotizacion - gastos };
  });

  return NextResponse.json(withTotals);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Nombre del proyecto requerido" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      tenantId: apiUser.tenantId,
      name: body.name,
      description: body.description || null,
      address: body.address || null,
      status: body.status || "cotizado",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      clientId: body.clientId || null,
      clientName: body.clientName || null,
    },
    include: { items: true, expenses: true, client: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}