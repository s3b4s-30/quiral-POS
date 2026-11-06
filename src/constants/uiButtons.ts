/**
 * src/constants/uiButtons.ts
 * Fuente de verdad centralizada de botones del Design System de Quiral POS.
 * Compatible con Modo Claro, Modo Oscuro (Dual OLED) y las 5 paletas de acento (Azul, Verde, Púrpura, Naranja, Rosa).
 */

/**
 * BTN_PRIMARY: Acción Principal / Crear / Guardar / Confirmar
 * Fondo sólido acento dinámico, texto blanco siempre legible, glow en hover y scale-95 en click.
 */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-xs hover:shadow-accent-glow active:scale-95 transition-all duration-150 cursor-pointer select-none shrink-0 tabular-nums disabled:opacity-50 disabled:pointer-events-none";

/**
 * BTN_SECONDARY: Acción Secundaria / "+ Nueva Categoría" / "+ Nuevo Atributo" / Presets
 * Fondo y bordes sutiles acento, texto acento con inversión a blanco en hover garantizada sin !important.
 */
export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-accent hover:text-white border border-accent/30 bg-accent/15 hover:bg-accent hover:border-accent shadow-xs hover:shadow-accent-glow active:scale-95 transition-all duration-150 cursor-pointer select-none shrink-0 disabled:opacity-50 disabled:pointer-events-none";

/**
 * BTN_TERTIARY: Acción Neutra / Cancelar / Limpiar / Restablecer
 * Superficie neutra adaptable, borde semántico, texto secundario a primario en hover.
 */
export const BTN_TERTIARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] hover:border-accent/40 active:scale-95 transition-all duration-150 cursor-pointer select-none shrink-0 disabled:opacity-50 disabled:pointer-events-none";
