import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.platformConfig.findUnique({ where: { key: "maintenance" } });
  const value = (config?.value as { enabled?: boolean; message?: string }) || {};
  return NextResponse.json({ enabled: value.enabled || false, message: value.message || "" });
}
