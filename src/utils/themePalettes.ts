/**
 * themePalettes.ts — Arquitectura de Tokens y Paletas de Acento Cromático
 *
 * Proporciona soporte para temas duales Apple HIG (Claro y Oscuro OLED)
 * con personalización del color de acento del sistema en tiempo real.
 */

import { AccentPaletteId } from "../types/domain";

export type { AccentPaletteId };

export interface AccentPalette {
  id: AccentPaletteId;
  name: string;
  shortName: string;
  description: string;
  previewColor: string;
  lightPrimary: string;
  darkPrimary: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: "blue",
    name: "Azul Clásico",
    shortName: "Azul",
    description: "Predeterminado Quiral / Apple HIG",
    previewColor: "#007aff",
    lightPrimary: "#007aff",
    darkPrimary: "#0a84ff",
  },
  {
    id: "emerald",
    name: "Verde Esmeralda",
    shortName: "Verde",
    description: "Frescura comercial, finanzas y dinamismo",
    previewColor: "#10b981",
    lightPrimary: "#10b981",
    darkPrimary: "#30d158",
  },
  {
    id: "purple",
    name: "Púrpura Pro",
    shortName: "Púrpura",
    description: "Elegancia, creatividad y distinción",
    previewColor: "#8b5cf6",
    lightPrimary: "#8b5cf6",
    darkPrimary: "#af52de",
  },
  {
    id: "orange",
    name: "Naranja Dinámico",
    shortName: "Naranja",
    description: "Energía de mostrador, retail y entusiasmo",
    previewColor: "#ff9500",
    lightPrimary: "#ff9500",
    darkPrimary: "#ff9f0a",
  },
  {
    id: "rose",
    name: "Rosa / Magenta",
    shortName: "Rosa",
    description: "Modernidad, estilo boutique y audacia",
    previewColor: "#ff2d55",
    lightPrimary: "#ff2d55",
    darkPrimary: "#ff375f",
  },
];

export const STORAGE_KEY_PALETTE = "quiral_accent_palette";

export function isValidPaletteId(id: unknown): id is AccentPaletteId {
  return typeof id === "string" && ACCENT_PALETTES.some((p) => p.id === id);
}

export function getStoredPalette(): AccentPaletteId {
  if (typeof window === "undefined") return "blue";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PALETTE);
    if (isValidPaletteId(stored)) {
      return stored;
    }
  } catch (err) {
    console.warn("No se pudo leer la paleta almacenada:", err);
  }
  return "blue";
}

export function applyPalette(paletteId: AccentPaletteId): void {
  if (typeof document === "undefined") return;
  const targetId = isValidPaletteId(paletteId) ? paletteId : "blue";
  document.documentElement.setAttribute("data-theme-palette", targetId);
  try {
    localStorage.setItem(STORAGE_KEY_PALETTE, targetId);
  } catch (err) {
    console.warn("No se pudo guardar la paleta en localStorage:", err);
  }
}

export function initThemePalette(): AccentPaletteId {
  const active = getStoredPalette();
  applyPalette(active);
  return active;
}
