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
  if (!body.description) {
    return NextResponse.json({ error: "Descripción requerida" }, { status: 400 });
  }

  const item = await prisma.projectItem.create({
    data: {
      tenantId: apiUser.tenantId,
      projectId: id,
      description: body.description,
      quantity: body.quantity ? parseFloat(body.quantity) : 1,
      unit: body.unit || "unidad",
      unitPrice: body.unitPrice ? parseFloat(body.unitPrice) : 0,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await prisma.projectItem.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.projectItem.update({
    where: { id },
    data: {
      description: body.description !== undefined ? body.description : undefined,
      quantity: body.quantity !== undefined ? parseFloat(body.quantity) : undefined,
      unit: body.unit !== undefined ? body.unit : undefined,
      unitPrice: body.unitPrice !== undefined ? parseFloat(body.unitPrice) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await prisma.projectItem.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}