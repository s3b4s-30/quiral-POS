import { useEffect, type RefObject } from "react";

export interface UsePosShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement>;
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Hook ergonómico de atajos de teclado para la estación POS Desktop (Keyboard-First).
 * Permite enfocar la búsqueda instantáneamente con la tecla '/' o 'Ctrl+F'
 * y limpiar/desenfocar con 'Escape'.
 */
export function usePosShortcuts({
  searchInputRef,
  onEscape,
  enabled = true,
}: UsePosShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Atajo global '/' o 'Ctrl+F' para búsqueda rápida si no se está escribiendo en otro input
      if (
        (e.key === "/" || (e.ctrlKey && e.key.toLowerCase() === "f")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Atajo 'Escape' para salir del buscador
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        onEscape?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef, onEscape, enabled]);
}
