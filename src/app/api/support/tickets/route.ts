import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    lastMessage: t.messages[0]?.content?.slice(0, 100) ?? null,
    messageCount: t._count.messages,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  })));
}

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, message } = await req.json();
  if (!subject || !message) {
    return NextResponse.json({ error: "subject and message required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: user.tenantId,
      subject,
      messages: {
        create: { content: message, authorType: "tenant" },
      },
    },
  });

  return NextResponse.json({ id: ticket.id, subject: ticket.subject, status: ticket.status });
}
