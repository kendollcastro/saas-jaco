import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { getPortalTenant } from "@/lib/portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let fontData: ArrayBuffer | null = null;

async function getFont() {
  if (fontData) return fontData;
  try {
    const buf = await readFile(join(process.cwd(), "public/fonts/manrope-bold.woff"));
    fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {}
  return fontData;
}

async function loadImage(src: string): Promise<string | null> {
  try {
    if (src.startsWith("data:")) return src;
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") || "image/png";
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const n = parseInt(size, 10) || 512;
  const font = await getFont();

  let tenant: any = null;
  try {
    tenant = await getPortalTenant();
  } catch {}

  const businessName = tenant?.settings?.businessName || tenant?.name || "Portal de Socios";
  const logoUrl = tenant?.settings?.logoUrl || "";
  const colorPrimary = tenant?.settings?.colorPrimary || "#3b82f6";

  const letter = initials(businessName);
  const logo = logoUrl ? await loadImage(logoUrl) : null;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colorPrimary,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width="72%" height="72%" style={{ objectFit: "contain" }} />
        ) : (
          <span style={{ color: "#ffffff", fontSize: n * 0.4, fontWeight: 800, fontFamily: "Manrope" }}>
            {letter}
          </span>
        )}
      </div>
    ),
    {
      width: n,
      height: n,
      fonts: font ? [{ name: "Manrope", data: font, weight: 800 as const }] : [],
    }
  );

  return image;
}
