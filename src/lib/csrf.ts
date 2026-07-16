import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

export function validateOrigin(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Check Origin header first (more reliable)
  if (origin) {
    return ALLOWED_ORIGINS.some(
      (allowed) => allowed && (origin === allowed || origin.startsWith(allowed + "/") || origin.startsWith(allowed + ":"))
    );
  }

  // Fallback to Referer
  if (referer) {
    return ALLOWED_ORIGINS.some((allowed) => allowed && referer.startsWith(allowed));
  }

  // No origin/referer = likely same-origin or direct API call (allow)
  return true;
}

export function csrfGuard(request: Request): NextResponse | null {
  if (request.method === "GET" || request.method === "HEAD") return null;
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }
  return null;
}
