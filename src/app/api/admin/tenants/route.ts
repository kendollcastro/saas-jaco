import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, bookings: true, members: true } },
      modules: {
        include: { module: true },
        where: { active: true },
      },
    },
  });

  return NextResponse.json(
    tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      plan: t.plan,
      active: t.active,
      createdAt: t.createdAt,
      users: t._count.users,
      bookings: t._count.bookings,
      members: t._count.members,
      activeModules: t.modules.map((m) => ({ key: m.module.key, name: m.module.name })),
    }))
  );
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y contraseña requeridos" }, { status: 400 });
    }

    // Check if tenant with this email already exists
    const existing = await prisma.tenant.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un tenant con este email" }, { status: 409 });
    }

    // Create Supabase Auth user
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Servicio no configurado (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 500 });
    }
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError || !authUser.user) {
      return NextResponse.json({ error: `Error al crear usuario: ${authError?.message || "desconocido"}` }, { status: 500 });
    }

    const slug = email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        email,
        settings: {
          create: {
            businessName: name,
            businessEmail: email,
          },
        },
      },
    });

    // Create DB user record linked to tenant
    await prisma.user.create({
      data: {
        id: authUser.user.id,
        email,
        name,
        role: "admin",
        tenantId: tenant.id,
      },
    });

    // Activate default modules (bookings + staff)
    const modules = await prisma.module.findMany({
      where: { key: { in: ["bookings", "staff"] } },
    });
    if (modules.length > 0) {
      await prisma.tenantModule.createMany({
        data: modules.map((m) => ({
          tenantId: tenant.id,
          moduleId: m.id,
          active: true,
        })),
      });
    }

    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al crear tenant" }, { status: 500 });
  }
}
