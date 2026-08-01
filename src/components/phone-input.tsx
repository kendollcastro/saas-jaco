"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "+506", flag: "🇨🇷", label: "Costa Rica" },
  { code: "+1", flag: "🇺🇸", label: "EE.UU. / Canadá" },
  { code: "+52", flag: "🇲🇽", label: "México" },
  { code: "+44", flag: "🇬🇧", label: "Reino Unido" },
  { code: "+34", flag: "🇪🇸", label: "España" },
  { code: "+57", flag: "🇨🇴", label: "Colombia" },
  { code: "+54", flag: "🇦🇷", label: "Argentina" },
  { code: "+56", flag: "🇨🇱", label: "Chile" },
  { code: "+58", flag: "🇻🇪", label: "Venezuela" },
  { code: "+51", flag: "🇵🇪", label: "Perú" },
  { code: "+49", flag: "🇩🇪", label: "Alemania" },
  { code: "+33", flag: "🇫🇷", label: "Francia" },
  { code: "+55", flag: "🇧🇷", label: "Brasil" },
  { code: "+1", flag: "🇨🇦", label: "Canadá" },
];

function digitsOf(v: string): string {
  return v.replace(/\D/g, "");
}

function formatLocal(digits: string, countryCode: string): string {
  const maxLocal = countryCode === "+506" ? 8 : 12;
  const d = digits.slice(0, maxLocal);
  if (countryCode === "+506") {
    if (d.length <= 4) return d;
    return `${d.slice(0, 4)} ${d.slice(4)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  className?: string;
  defaultCode?: string;
}

export default function PhoneInput({ value, onChange, className, defaultCode = "+506" }: PhoneInputProps) {
  const [code, setCode] = useState(defaultCode);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fullDigits = digitsOf(value);
  const codeDigits = digitsOf(code);
  const localDigits = fullDigits.startsWith(codeDigits)
    ? fullDigits.slice(codeDigits.length)
    : fullDigits;

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = digitsOf(e.target.value);
    onChange(`${code}${raw}`);
  }

  function selectCountry(c: { code: string; flag: string; label: string }) {
    const local = digitsOf(value).replace(digitsOf(code), "");
    setCode(c.code);
    setPickerOpen(false);
    onChange(`${c.code}${local}`);
    inputRef.current?.focus();
  }

  const current = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Código de país"
          aria-expanded={pickerOpen}
          className="flex items-center gap-1.5 px-3 border border-r-0 border-input rounded-l-xl bg-muted/50 cursor-pointer hover:bg-muted transition shrink-0"
        >
          <span className="text-[15px] leading-none">{current.flag}</span>
          <span className="text-[13px] font-bold text-foreground">{code}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={cn("text-muted-foreground transition-transform", pickerOpen && "rotate-180")}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <input
          ref={inputRef}
          value={formatLocal(localDigits, code)}
          onChange={handleLocalChange}
          onFocus={() => setPickerOpen(false)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={code === "+506" ? "8888 8888" : "555 123 4567"}
          className="w-full px-4 py-3.5 border border-input rounded-r-xl text-[16px] font-sans text-foreground bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </div>

      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-background border border-border rounded-xl shadow-2xl max-h-[280px] overflow-y-auto">
            {COUNTRIES.map((c, i) => (
              <button
                key={`${c.code}-${i}`}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer transition ${
                  c.code === code ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <span className="text-[16px] leading-none">{c.flag}</span>
                <span className="text-[13px] font-semibold flex-1">{c.label}</span>
                <span className="text-[13px] font-bold text-muted-foreground">{c.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
