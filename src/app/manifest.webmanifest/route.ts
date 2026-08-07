import { NextResponse } from "next/server";
import { getPortalTenant } from "@/lib/portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  let tenant: any = null;
  try {
    tenant = await getPortalTenant(slug);
  } catch {}

  const businessName = tenant?.settings?.businessName || tenant?.name || "Portal de Socios";
  const colorPrimary = tenant?.settings?.colorPrimary || "#3b82f6";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return NextResponse.json({
    name: businessName,
    short_name: businessName.slice(0, 12) || "Portal",
    description: `Portal de socios de ${businessName}`,
    start_url: `/portal/login${slug ? `?slug=${slug}` : ""}`,
    scope: "/portal",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f9",
    theme_color: colorPrimary,
    categories: ["lifestyle", "fitness"],
    icons: [
      { src: `${baseUrl}/api/portal/logo/192`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${baseUrl}/api/portal/logo/512`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${baseUrl}/api/portal/logo/512`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  });
}
