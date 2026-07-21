"use client";

import { useState, useEffect, useRef } from "react";
import { Scan, CheckCircle, XCircle, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckinPage() {
  const [scanned, setScanned] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>("");
  const [status, setStatus] = useState<"scanning" | "success" | "error" | "already">("scanning");
  const [error, setError] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      if (!scannerRef.current) return;
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("checkin-scanner");
      html5QrCodeRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (cancelled || status !== "scanning") return;
            await scanner.stop();
            setScanned(decodedText);
            await recordCheckin(decodedText);
          },
          () => {}
        );
      } catch (e) {
        if (!cancelled) setError("No se pudo acceder a la cámara. Asegurate de aceptar el permiso.");
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function recordCheckin(memberId: string) {
    setStatus("scanning");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();

      if (data.member?.name) setMemberName(data.member.name);
      if (data.dateOut) {
        setStatus("already"); // checked out
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setError("Error al registrar asistencia");
    }
  }

  function reset() {
    setScanned(null);
    setMemberName("");
    setStatus("scanning");
    setError("");

    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (status !== "scanning") return;
          await html5QrCodeRef.current.stop();
          setScanned(decodedText);
          await recordCheckin(decodedText);
        },
        () => {}
      ).catch(() => {});
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition">
          <ArrowLeft className="size-[17px]" />
        </Link>
        <div>
          <h1 className="text-[18px] font-extrabold text-foreground">Check-in QR</h1>
          <p className="text-[12px] text-muted-foreground">Escaneá el QR del socio para registrar ingreso</p>
        </div>
      </div>

      {error && !scanned && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <XCircle className="size-[18px] text-destructive shrink-0" />
          <p className="text-[13px] font-semibold text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        {status === "scanning" && (
          <div>
            <div ref={scannerRef} id="checkin-scanner" className="w-full aspect-square bg-black" />
            <div className="flex items-center justify-center gap-2 py-4 text-center">
              <Scan className="size-[16px] text-primary animate-pulse" />
              <span className="text-[12px] font-semibold text-muted-foreground">Esperando código QR...</span>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="size-10 text-emerald-500" />
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-foreground">¡Ingreso registrado!</p>
              {memberName && <p className="text-[16px] text-muted-foreground mt-1">{memberName}</p>}
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-[14px] hover:bg-primary/90 transition cursor-pointer"
            >
              <Scan className="size-[16px]" />
              Escanear otro
            </button>
          </div>
        )}

        {status === "already" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
              <User className="size-10 text-blue-500" />
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-foreground">¡Salida registrada!</p>
              {memberName && <p className="text-[16px] text-muted-foreground mt-1">{memberName}</p>}
              <p className="text-[12px] text-muted-foreground mt-2">Ya había ingresado hoy — se registró la salida</p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-[14px] hover:bg-primary/90 transition cursor-pointer"
            >
              <Scan className="size-[16px]" />
              Escanear otro
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="size-10 text-destructive" />
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-foreground">Error</p>
              <p className="text-[14px] text-muted-foreground mt-1">{error || "No se pudo registrar el ingreso"}</p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-[14px] hover:bg-primary/90 transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-muted-foreground">
        También podés buscar al socio manualmente en la sección Socios
      </div>
    </div>
  );
}
