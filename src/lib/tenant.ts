import { prisma } from "./prisma";
import { headers } from "next/headers";

export async function getTenantFromHost() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const slug = host.split(".")[0]; // mijsaas.jaco.com → "mijsaas"

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      modules: { include: { module: true } },
      settings: true,
    },
  });

  return tenant;
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      modules: { include: { module: true } },
      settings: true,
    },
  });
}
