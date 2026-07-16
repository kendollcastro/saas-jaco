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
  const product = await prisma.product.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? product.name,
      description: body.description !== undefined ? body.description : product.description,
      barcode: body.barcode !== undefined ? body.barcode : product.barcode,
      price: body.price !== undefined ? parseFloat(body.price) : product.price,
      cost: body.cost !== undefined ? (body.cost ? parseFloat(body.cost) : null) : product.cost,
      stock: body.stock !== undefined ? parseInt(body.stock) : product.stock,
      category: body.category ?? product.category,
      active: body.active !== undefined ? body.active : product.active,
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
  const product = await prisma.product.findFirst({
    where: { id, tenantId: apiUser.tenantId },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
