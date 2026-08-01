export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_token") || sessionStorage.getItem("portal_token");
}

export function setToken(token: string, remember = false) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem("portal_token", token);
  other.removeItem("portal_token");
  if (remember) {
    localStorage.removeItem("portal_member");
  } else {
    sessionStorage.removeItem("portal_member");
  }
}

export function clearToken() {
  localStorage.removeItem("portal_token");
  localStorage.removeItem("portal_member");
  sessionStorage.removeItem("portal_token");
  sessionStorage.removeItem("portal_member");
}

export function getStoredMember(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("portal_member") || sessionStorage.getItem("portal_member");
  return raw ? JSON.parse(raw) : null;
}

export function storeMember(member: any) {
  if (localStorage.getItem("portal_token")) {
    localStorage.setItem("portal_member", JSON.stringify(member));
  } else {
    sessionStorage.setItem("portal_member", JSON.stringify(member));
  }
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
