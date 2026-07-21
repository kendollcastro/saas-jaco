"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken, getStoredMember } from "@/lib/portal-client";

export default function QrPage() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/portal/login"); return; }
    const cached = getStoredMember();
    if (cached) setMember(cached);
    fetch("/api/portal/me", { headers: { "x-portal-token": token } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { clearToken(); router.replace("/portal/login"); }
        else setMember(data);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!member?.id) return;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(member.id, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url: string) => setQrDataUrl(url))
        .catch(() => setError("Error al generar QR"));
    });
  }, [member?.id]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-[20px] font-extrabold text-foreground">Mi código QR</h1>
        <p className="text-[12px] text-muted-foreground">
          Mostrá este código al ingresar al gimnasio
        </p>
      </div>

      {error && (
        <div className="text-center text-sm font-semibold text-destructive">{error}</div>
      )}

      <div className="flex justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-border/50">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR de socio" className="w-[260px] h-[260px]" />
          ) : (
            <div className="w-[260px] h-[260px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {member && (
        <div className="text-center space-y-1">
          <p className="text-[15px] font-bold text-foreground">{member.name}</p>
          <p className="text-[12px] text-muted-foreground">ID: {member.id.slice(0, 8)}...</p>
        </div>
      )}

      <div className="text-center text-[11px] text-muted-foreground">
        Este código cambia cada vez que iniciás sesión por seguridad
      </div>
    </div>
  );
}
