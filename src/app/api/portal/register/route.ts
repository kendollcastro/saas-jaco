import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, generateToken, getPortalTenant } from "@/lib/portal-auth";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const { name, phone: rawPhone, email, pin, membership, slug } = await request.json();
    const phone = normalizePhone(rawPhone);

    if (!name || !phone || !pin || !membership) {
      return NextResponse.json({ error: "Nombre, teléfono, PIN y tipo membresía requeridos" }, { status: 400 });
    }
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: "PIN debe ser de 4 a 6 dígitos" }, { status: 400 });
    }

    const tenant = await getPortalTenant(slug || null);

    const existing = await prisma.member.findFirst({ where: { tenantId: tenant.id, phone } });
    if (existing) {
      return NextResponse.json({ error: "Este teléfono ya está registrado" }, { status: 400 });
    }

    const token = generateToken();
    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        name,
        phone,
        email: email || null,
        membership,
        status: "pending",
        pin: hashPin(pin),
        authToken: token,
      },
    });

    const sinpePhone = tenant.settings?.sinpePhone || null;
    const sinpeName = tenant.settings?.sinpeName || null;

    return NextResponse.json({
      member: { id: member.id, name: member.name, phone: member.phone, email: member.email, membership: member.membership, status: member.status },
      token,
      sinpe: sinpePhone ? { phone: sinpePhone, name: sinpeName } : null,
    });
  } catch {
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
