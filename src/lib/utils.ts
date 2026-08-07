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

const pad2 = (n: number) => String(n).padStart(2, "0")

// Date-only values are stored as UTC midnight (new Date("YYYY-MM-DD")).
// Format with UTC getters so the calendar date is timezone-independent.

export function utcDateOnly(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

// For a local calendar Date (e.g. grid cells built with new Date(y, m, d)),
// produce the YYYY-MM-DD the user sees in their timezone.

export function localDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayLocalDateOnly(): string {
  return localDateOnly(new Date())
}

// "YYYY-MM-DD" from an <input type="date"> → local-midnight Date for display
export function parseDateInput(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function fmtStoredDate(d: string | Date, months: string[]): string {
  const dt = new Date(d)
  return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}

export function daysUntilStoredDate(endDate: string | null, now = new Date()): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  const nowLocal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((endUtc - nowLocal) / 86400000)
}
