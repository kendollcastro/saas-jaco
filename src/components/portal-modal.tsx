"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, Scan, Link as LinkIcon } from "lucide-react";

interface PortalModalProps {
  open: boolean;
  onClose: () => void;
  slug: string | null;
}

export default function PortalModal({ open, onClose, slug }: PortalModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/portal`;
    return slug ? `${base}?slug=${encodeURIComponent(slug)}` : base;
  }, [slug]);

  useEffect(() => {
    if (!open || !portalUrl) return;
    setQrDataUrl("");
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(portalUrl, {
        width: 260,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    });
  }, [open, portalUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      "¡Hola! Este es tu portal de socios para reservar tus clases: "
    );
    window.open(
      `https://wa.me/?text=${text}${encodeURIComponent(portalUrl)}`,
      "_blank"
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="size-4 text-primary" />
            Portal de socios
          </DialogTitle>
          <DialogDescription>
            Compartí este link o QR con tus clientes para que reserven clases y
            gestionen su membresía.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="bg-white rounded-3xl p-5 shadow-inner border border-border/60">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR del portal de socios" className="w-[220px] h-[220px]" />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[10px] bg-muted px-3 py-2.5">
          <LinkIcon className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="text-[12px] text-muted-foreground truncate flex-1">
            {portalUrl || "Cargando…"}
          </span>
          <button
            onClick={copyLink}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Copiar link"
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copiar link
          </Button>
          <Button onClick={shareWhatsApp} className="flex-1 gap-2">
            <MessageCircle className="size-4" />
            Compartir por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
