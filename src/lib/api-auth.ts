import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getApiUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API routes don't write cookies
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, tenantId: true, role: true },
  });

  return dbUser;
}
