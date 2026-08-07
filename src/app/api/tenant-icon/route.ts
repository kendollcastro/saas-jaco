import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { getTenantBranding } from "@/lib/tenant-brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchImage(src: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    if (src.startsWith("data:")) {
      const match = src.match(/^data:(image\/(?:png|jpeg|gif|webp|svg\+xml));base64,(.+)$/);
      if (!match) return null;
      const contentType = match[1] === "image/svg+xml" ? "image/svg+xml" : match[1];
      const buffer = Buffer.from(match[2], "base64");
      return { buffer, contentType };
    }
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
  } catch {
    return null;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function GET() {
  const apiUser = await getApiUser();
  if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branding = await getTenantBranding(apiUser.tenantId);

  // If a logo exists, serve it directly as the favicon.
  if (branding.logoUrl) {
    const img = await fetchImage(branding.logoUrl);
    if (img) {
      return new NextResponse(new Uint8Array(img.buffer), {
        headers: {
          "Content-Type": img.contentType,
          "Cache-Control": "public, max-age=3600, must-revalidate",
        },
      });
    }
  }

  // Fallback: generate a colored square with the business initials.
  const size = 64;
  const bg = branding.colorPrimary || "#1e40af";
  const letter = initials(branding.businessName || "Ola");

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="14" fill="${bg}" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Manrope, Arial, sans-serif" font-size="26" font-weight="800" fill="white">
        ${letter}
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
