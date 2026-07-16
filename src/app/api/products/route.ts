import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { tenantId: apiUser.tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      tenantId: apiUser.tenantId,
      name: body.name,
      description: body.description || null,
      barcode: body.barcode || null,
      price: parseFloat(body.price) || 0,
      cost: body.cost ? parseFloat(body.cost) : null,
      stock: parseInt(body.stock) || 0,
      category: body.category || "general",
    },
  });

  return NextResponse.json(product, { status: 201 });
}
