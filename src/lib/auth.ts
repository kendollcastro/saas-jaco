import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import { sendEmail } from "./email";
import WelcomeEmail from "@/emails/welcome";
import { render } from "@react-email/components";

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

  const isNewTenant = !tenant;

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

  // Send welcome email on first-time registration (never block signup on email failure)
  if (isNewTenant) {
    try {
      const html = await render(
        WelcomeEmail({
          name,
          tenantName: tenant!.name,
          dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        })
      );
      await sendEmail({ to: email, subject: "Bienvenido a Ola Saas", html });
    } catch (err) {
      console.error("Welcome email failed (ignored):", err);
    }
  }

  // Create user record
  const superEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const role = superEmails.includes(email.toLowerCase()) ? "super_admin" : "admin";
  await prisma.user.upsert({
    where: { id: authUser.id },
    update: { email, name, role },
    create: {
      id: authUser.id,
      email,
      name,
      role,
      tenantId: tenant.id,
    },
  });

  return await prisma.user.findUnique({ where: { id: authUser.id } });
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
