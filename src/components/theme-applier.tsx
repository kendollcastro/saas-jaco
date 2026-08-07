"use client";

import { useEffect } from "react";

const themePresets: Record<string, { primary: string; name: string }> = {
  default: { primary: "#1e40af", name: "Default" },
  ocean: { primary: "#0d9488", name: "Ocean" },
  forest: { primary: "#16a34a", name: "Forest" },
  sunset: { primary: "#ea580c", name: "Sunset" },
  midnight: { primary: "#7c3aed", name: "Midnight" },
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

function applyThemeTo(target: HTMLElement | null, preset: string, customColor?: string, logoUrl?: string) {
  const primary = preset && themePresets[preset] ? themePresets[preset].primary : (customColor || "#1e40af");
  const root = target || document.documentElement;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-ring", primary);
  root.style.setProperty("--color-chart-1", primary);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--chart-1", primary);

  // Derive sidebar colors from primary
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-primary-foreground", "#ffffff");
  root.style.setProperty("--sidebar", darken(primary, 0.85));
  root.style.setProperty("--sidebar-foreground", "#ffffff");
  root.style.setProperty("--sidebar-accent", "rgba(255, 255, 255, 0.08)");
  root.style.setProperty("--sidebar-border", "rgba(255, 255, 255, 0.06)");

  // Update sidebar logo
  if (logoUrl) {
    const sidebarLogo = document.getElementById("sidebar-logo-text");
    if (sidebarLogo) {
      const img = sidebarLogo.querySelector("img");
      if (img) img.src = logoUrl;
    }
  }
}

export function applyDashboardTheme(preset: string, customColor?: string, logoUrl?: string) {
  applyThemeTo(document.getElementById("theme-root"), preset, customColor, logoUrl);
}

function applyTheme(preset: string, customColor?: string, logoUrl?: string) {
  applyThemeTo(document.documentElement, preset, customColor, logoUrl);
}

export default function ThemeApplier({
  themePreset,
  colorPrimary,
  logoUrl,
}: {
  themePreset?: string;
  colorPrimary?: string;
  logoUrl?: string;
}) {
  useEffect(() => {
    if (themePreset) {
      applyTheme(themePreset, colorPrimary, logoUrl);
      return;
    }
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Settings fetch failed: " + r.status);
        return r.json();
      })
      .then((data) => {
        applyTheme(data.themePreset || "default", data.colorPrimary, data.logoUrl);
      })
      .catch((err) => {
        console.warn("Theme fallback:", err?.message);
        applyTheme("default");
      });
  }, [themePreset, colorPrimary, logoUrl]);

  return null;
}
