import { prisma } from "./prisma";

export async function logEvent(type: string, description: string, tenantId?: string) {
  await prisma.platformEvent.create({ data: { type, description, tenantId: tenantId || null } });
}
