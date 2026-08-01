"use client";

import { useEffect } from "react";

const themePresets: Record<string, string> = {
  default: "#1e40af",
  ocean: "#0d9488",
  forest: "#16a34a",
  sunset: "#ea580c",
  midnight: "#7c3aed",
};

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16) };
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

function applyPortalTheme(preset: string, customColor?: string) {
  const primary = preset && themePresets[preset] ? themePresets[preset] : (customColor || "#1e40af");
  const root = document.documentElement;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-ring", primary);
  root.style.setProperty("--color-chart-1", primary);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--chart-1", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar", darken(primary, 0.85));
}

export default function PortalTheme() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    let tenantId: string | null = null;
    try {
      const raw = localStorage.getItem("portal_member") || sessionStorage.getItem("portal_member");
      if (raw) tenantId = JSON.parse(raw)?.tenantId || null;
    } catch {}

    const qs = new URLSearchParams();
    if (tenantId) qs.set("tenantId", tenantId);
    else if (slug) qs.set("slug", slug);
    const query = qs.toString() ? `?${qs.toString()}` : "";

    fetch(`/api/portal/settings${query}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.colorPrimary || d.themePreset) {
          applyPortalTheme(d.themePreset || "default", d.colorPrimary);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
