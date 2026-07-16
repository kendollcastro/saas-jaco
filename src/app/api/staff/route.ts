import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { staffSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/phone";

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
  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, phone, email, role } = parsed.data;

  const member = await prisma.staff.create({
    data: {
      tenantId: apiUser.tenantId,
      name,
      phone: normalizePhone(phone),
      email: email || null,
      role: role || null,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
