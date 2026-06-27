import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function syncUser() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) return null;

  const email = authUser.email!;
  const name = authUser.user_metadata?.full_name || email.split("@")[0];

  // Check if user exists in our DB
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) return existing;

  // Find or create tenant for this user
  let tenant = await prisma.tenant.findFirst({ where: { email } });

  if (!tenant) {
    const slug = email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();
    tenant = await prisma.tenant.create({
      data: {
        name: `${name}'s Business`,
        slug,
        email,
        settings: {
          create: {
            businessName: `${name}'s Business`,
            businessEmail: email,
          },
        },
      },
    });

    // Activate default modules (bookings + staff)
    const modules = await prisma.module.findMany({
      where: { key: { in: ["bookings", "staff"] } },
    });
    if (modules.length > 0) {
      await prisma.tenantModule.createMany({
        data: modules.map((m) => ({
          tenantId: tenant!.id,
          moduleId: m.id,
          active: true,
        })),
      });
    }
  }

  // Create user record
  const user = await prisma.user.create({
    data: {
      id: authUser.id,
      email,
      name,
      role: "admin",
      tenantId: tenant.id,
    },
  });

  return user;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { tenant: true },
  });
  return dbUser;
}
