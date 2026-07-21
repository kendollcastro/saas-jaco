import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { tenantId: apiUser.tenantId },
    include: { items: true, member: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(sales);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.items?.length) {
    return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
  }

  // Batch validate stock and calculate totals
  const productIds = body.items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: apiUser.tenantId },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const saleItems: any[] = [];

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Producto no encontrado: ${item.productId}` }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Stock insuficiente para ${product.name}` }, { status: 400 });
    }

    const total = product.price * item.quantity;
    subtotal += total;

    saleItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      total,
    });
  }

  const sale = await prisma.sale.create({
    data: {
      tenantId: apiUser.tenantId,
      memberId: body.memberId || null,
      subtotal,
      total: subtotal,
      method: body.method || "efectivo",
      items: { create: saleItems },
    },
    include: { items: true, member: true },
  });

  // Deduct stock in batch
  await prisma.$transaction(
    body.items.map((item: any) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );

  return NextResponse.json(sale, { status: 201 });
}
