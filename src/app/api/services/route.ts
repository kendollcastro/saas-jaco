import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

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
  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      tenantId: apiUser.tenantId,
      name: body.name,
      description: body.description || null,
      price: body.price ? parseFloat(body.price) : null,
      duration: body.duration ? parseInt(body.duration) : null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
