import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
].filter(Boolean);

function validateOrigin(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const value = origin || referer;
  if (!value) return true;

  try {
    const parsed = new URL(value);
    // Allow the app's own host on any configured domain (Vercel/custom/…) so
    // same-origin mutating requests from production are never rejected.
    const self = new URL(request.url);
    if (parsed.hostname === self.hostname && parsed.port === self.port) return true;
    return ALLOWED_ORIGINS.some((a) => {
      if (!a) return false;
      const allowed = new URL(a);
      return parsed.hostname === allowed.hostname && parsed.port === allowed.port;
    });
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF check for mutating API requests
  if (pathname.startsWith("/api/") && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isApi = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/portal");

  if (!isDashboard && !isApi && !isAdmin) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
