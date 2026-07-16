import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return t.slice(0, 5)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}
