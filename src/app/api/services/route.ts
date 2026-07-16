import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { serviceSchema } from "@/lib/validations";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { tenantId: apiUser.tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, price, duration } = parsed.data;

  const service = await prisma.service.create({
    data: {
      tenantId: apiUser.tenantId,
      name,
      description: description || null,
      price: price ?? null,
      duration: duration ?? null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
