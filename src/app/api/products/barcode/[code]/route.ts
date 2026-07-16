import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await params;
  const product = await prisma.product.findFirst({
    where: { tenantId: apiUser.tenantId, barcode: code, active: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  if (product.stock <= 0) {
    return NextResponse.json({ error: "Sin stock" }, { status: 400 });
  }

  return NextResponse.json(product);
}
