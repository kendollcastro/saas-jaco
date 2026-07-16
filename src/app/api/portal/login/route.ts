import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, generateToken, getPortalTenant } from "@/lib/portal-auth";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { phone: rawPhone, pin, slug } = await request.json();
    const phone = normalizePhone(rawPhone);
    if (!phone || !pin) {
      return NextResponse.json({ error: "Teléfono y PIN requeridos" }, { status: 400 });
    }

    // Rate limit by phone
    const rl = rateLimit(`portal-login:${phone}`);
    if (!rl.allowed) {
      const minutes = Math.ceil(rl.retryAfter / 60);
      return NextResponse.json({
        error: `Demasiados intentos. Intenta de nuevo en ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
        retryAfter: rl.retryAfter,
      }, {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      });
    }

    const where: any = { phone };
    if (slug) {
      const tenant = await getPortalTenant(slug);
      where.tenantId = tenant.id;
    }

    const member = await prisma.member.findFirst({ where });
    if (!member || member.pin !== hashPin(pin)) {
      return NextResponse.json({ error: "Teléfono o PIN incorrecto" }, { status: 401 });
    }

    const token = generateToken();
    await prisma.member.update({ where: { id: member.id }, data: { authToken: token } });

    return NextResponse.json({
      member: { id: member.id, name: member.name, phone: member.phone, email: member.email, membership: member.membership, status: member.status, tenantId: member.tenantId },
      token,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
