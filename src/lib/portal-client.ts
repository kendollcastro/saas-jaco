export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token");
}

export function setToken(token: string) {
  localStorage.setItem("portal_token", token);
}

export function clearToken() {
  localStorage.removeItem("portal_token");
  localStorage.removeItem("portal_member");
}

export function getStoredMember(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("portal_member");
  return raw ? JSON.parse(raw) : null;
}

export function storeMember(member: any) {
  localStorage.setItem("portal_member", JSON.stringify(member));
}

export async function portalFetch(url: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-portal-token": token } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
}
