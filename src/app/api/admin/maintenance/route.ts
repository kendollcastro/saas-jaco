import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/audit";

export async function PATCH(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { enabled, message } = body;

  const existing = await prisma.platformConfig.findUnique({ where: { key: "maintenance" } });
  const currentValue = (existing?.value as { enabled?: boolean; message?: string }) || {};

  await prisma.platformConfig.upsert({
    where: { key: "maintenance" },
    update: {
      value: {
        ...currentValue,
        ...(enabled !== undefined && { enabled }),
        ...(message !== undefined && { message }),
      },
    },
    create: {
      key: "maintenance",
      value: {
        enabled: enabled ?? false,
        message: message ?? "",
      },
    },
  });

  if (enabled !== undefined) {
    await logEvent(enabled ? "maintenance.on" : "maintenance.off", `Modo mantenimiento ${enabled ? "activado" : "desactivado"}`);
  }

  return NextResponse.json({ success: true });
}
