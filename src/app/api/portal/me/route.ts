import { NextResponse } from "next/server";
import { getPortalMember } from "@/lib/portal-auth";

export async function GET(request: Request) {
  const member = await getPortalMember(request);
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  return NextResponse.json({
    id: member.id,
    name: member.name,
    phone: member.phone,
    email: member.email,
    membership: member.membership,
    status: member.status,
    startDate: member.startDate,
    endDate: member.endDate,
  });
}
