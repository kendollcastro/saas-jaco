import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  const body = await request.json();
  const tenantId = "TENANT_ID_PLACEHOLDER";

  const member = await prisma.staff.create({
    data: {
      tenantId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      role: body.role,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
