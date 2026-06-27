import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const body = await request.json();
  const tenantId = "TENANT_ID_PLACEHOLDER";

  const service = await prisma.service.create({
    data: {
      tenantId,
      name: body.name,
      price: body.price ? parseFloat(body.price) : null,
      duration: body.duration ? parseInt(body.duration) : null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
