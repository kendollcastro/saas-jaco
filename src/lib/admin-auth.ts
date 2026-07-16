import { getApiUser } from "./api-auth";
import { prisma } from "./prisma";

function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || "kendollcastro@gmail.com";
  return raw.split(",").map((e: string) => e.trim().toLowerCase());
}

export async function upgradeIfSuperAdmin(apiUser: { id: string; email: string; role: string }) {
  if (getSuperAdminEmails().includes(apiUser.email.toLowerCase())) {
    await prisma.user.update({
      where: { id: apiUser.id },
      data: { role: "super_admin" },
    });
    return true;
  }
  return false;
}

export async function requireSuperAdmin() {
  const apiUser = await getApiUser();
  if (!apiUser) return null;

  if (apiUser.role === "super_admin") return apiUser;

  if (await upgradeIfSuperAdmin(apiUser)) {
    return { ...apiUser, role: "super_admin" as const };
  }

  return null;
}
