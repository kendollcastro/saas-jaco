import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { upgradeIfSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let role = user.role;
  if (role !== "super_admin" && await upgradeIfSuperAdmin(user)) {
    role = "super_admin";
  }

  return NextResponse.json({ role });
}
