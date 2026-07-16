import { prisma } from "./prisma";
import crypto from "crypto";

const PIN_SALT = process.env.PIN_SALT || "ola-portal-v1";

export function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin + PIN_SALT).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getPortalMember(request: Request) {
  const token = request.headers.get("x-portal-token");
  if (!token) return null;
  return prisma.member.findFirst({ where: { authToken: token } });
}

export async function getPortalTenant(slug?: string | null) {
  if (slug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    });
    if (tenant) return tenant;
  }
  const tenant = await prisma.tenant.findFirst({
    where: { users: { some: {} } },
    include: { settings: true },
    orderBy: { createdAt: "asc" },
  });
  if (!tenant) {
    const fallback = await prisma.tenant.findFirst({ include: { settings: true } });
    if (!fallback) throw new Error("No tenant configured");
    return fallback;
  }
  return tenant;
}
