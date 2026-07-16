"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/portal-client";

export default function PortalPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? "/portal/dashboard" : "/portal/login");
  }, [router]);
  return null;
}
