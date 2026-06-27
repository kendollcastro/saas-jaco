"use client";

import { useEffect, useCallback } from "react";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
}: SlideOverProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        className="absolute inset-0 bg-[rgba(15,23,42,.45)] animate-[jacoFade_0.2s_ease]"
        onClick={onClose}
      />
      <div className="relative w-[472px] max-w-[92vw] h-full bg-white flex flex-col shadow-[-8px_0_40px_rgba(15,23,42,.18)] animate-[jacoSlide_0.26s_cubic-bezier(.16,.84,.44,1)]">
        <div className="flex items-start justify-between px-[26px] pt-6 pb-5 border-b border-[#eef2f6] shrink-0">
          <div>
            <div className="text-lg font-extrabold tracking-tight text-[#0f172a]">
              {title}
            </div>
            {description && (
              <div className="text-[13px] text-[#64748b] mt-[3px]">
                {description}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[9px] border border-[#e8ecf2] bg-white text-[#64748b] flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-50 transition"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
