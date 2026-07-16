import { NextResponse } from "next/server";
import { getPortalTenant } from "@/lib/portal-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const tenant = await getPortalTenant(slug);
    const s = tenant.settings;

    return NextResponse.json({
      businessName: s?.businessName || tenant.name,
      businessPhone: s?.businessPhone || tenant.phone || null,
      businessEmail: s?.businessEmail || tenant.email || null,
      logoUrl: s?.logoUrl || null,
      colorPrimary: s?.colorPrimary || "#3b82f6",
      sinpePhone: s?.sinpePhone || null,
      sinpeName: s?.sinpeName || null,
      themePreset: s?.themePreset || "default",
      tenantSlug: tenant.slug,
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener configuracion" }, { status: 500 });
  }
}
