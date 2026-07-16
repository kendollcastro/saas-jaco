import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
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
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.status === "closed") return NextResponse.json({ error: "Ticket closed" }, { status: 400 });

  const message = await prisma.supportMessage.create({
    data: { ticketId: id, content, authorType: "tenant" },
  });

  await prisma.supportTicket.update({ where: { id }, data: { status: "open" } });

  return NextResponse.json({ id: message.id, content: message.content, authorType: "tenant", createdAt: message.createdAt });
}
