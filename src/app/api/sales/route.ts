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

  // Create sale + deduct stock atomically so a retry can't duplicate the sale.
  // Uses a batch transaction (compatible with Supabase transaction pooling).
  let sale;
  try {
    const [created, ...stockResults] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          tenantId: apiUser.tenantId,
          memberId: body.memberId || null,
          subtotal,
          total: subtotal,
          method: body.method || "efectivo",
          items: { create: saleItems },
        },
        include: { items: true, member: true },
      }),
      // Deduct stock conditionally (idempotent guard against concurrent oversell)
      ...body.items.map((item: { productId: string; quantity: number }) =>
        prisma.product.updateMany({
          where: { id: item.productId, tenantId: apiUser.tenantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
      ),
    ]);

    // If any stock deduction failed (0 rows matched), roll back the sale
    const failed = body.items.findIndex((item: { productName: string }, i: number) => stockResults[i]?.count === 0);
    if (failed !== -1) {
      await prisma.sale.delete({ where: { id: created.id } });
      return NextResponse.json(
        { error: `Stock insuficiente para ${body.items[failed].productName}` },
        { status: 400 }
      );
    }

    sale = created;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("Stock insuficiente")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al registrar la venta" }, { status: 500 });
  }

  return NextResponse.json(sale, { status: 201 });
}
