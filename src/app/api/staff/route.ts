import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findMany({
    where: { tenantId: apiUser.tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const member = await prisma.staff.create({
    data: {
      tenantId: apiUser.tenantId,
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      role: body.role || null,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
