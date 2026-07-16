import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, slug: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    tenantName: ticket.tenant.name,
    tenantSlug: ticket.tenant.slug,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      content: m.content,
      authorType: m.authorType,
      createdAt: m.createdAt,
    })),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content, action } = await req.json();

  if (action === "close") {
    const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { tenant: { select: { name: true } } } });
    await prisma.supportTicket.update({ where: { id }, data: { status: "closed" } });
    if (ticket) await logEvent("ticket.closed", `Ticket "${ticket.subject}" de ${ticket.tenant.name} cerrado`, ticket.tenantId);
    return NextResponse.json({ success: true, status: "closed" });
  }

  if (action === "reopen") {
    const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { tenant: { select: { name: true } } } });
    await prisma.supportTicket.update({ where: { id }, data: { status: "open" } });
    if (ticket) await logEvent("ticket.reopened", `Ticket "${ticket.subject}" de ${ticket.tenant.name} reabierto`, ticket.tenantId);
    return NextResponse.json({ success: true, status: "open" });
  }

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: id,
      content,
      authorType: "admin",
      authorId: admin.id,
    },
  });

  await prisma.supportTicket.update({ where: { id }, data: { status: "awaiting" } });

  return NextResponse.json({ id: message.id, content: message.content, authorType: "admin", createdAt: message.createdAt });
}
