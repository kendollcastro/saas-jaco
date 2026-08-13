import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  if (!body.concept) {
    return NextResponse.json({ error: "Concepto requerido" }, { status: 400 });
  }

  const expense = await prisma.projectExpense.create({
    data: {
      tenantId: apiUser.tenantId,
      projectId: id,
      concept: body.concept,
      amount: body.amount ? parseFloat(body.amount) : 0,
      category: body.category || "materiales",
      method: body.method || "sinpe",
      sinpeRef: body.sinpeRef || null,
      receiptUrl: body.receiptUrl || null,
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const expense = await prisma.projectExpense.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}