export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `+506${digits}`;
  if (digits.length === 11 && digits.startsWith("506")) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith("506")) return `+${digits}`;
  if (digits.startsWith("506")) return `+${digits}`;
  if (digits.startsWith("+")) return digits;
  return `+506${digits}`;
}

export function digitsOnly(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = digitsOnly(phone);
  if (d.length === 11 && d.startsWith("506")) return `+506 ${d.slice(3, 7)} ${d.slice(7)}`;
  if (d.length === 8) return `+506 ${d.slice(0, 4)} ${d.slice(4)}`;
  return phone;
}

export function waPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return digitsOnly(phone).replace(/^\+?/, "");
}
