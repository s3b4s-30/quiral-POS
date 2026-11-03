import { useState, useEffect } from "react";

/**
 * Hook reactivo para detectar viewport de escritorio (>= 768px).
 * Se suscribe a cambios en tiempo real mediante window.matchMedia('(min-width: 768px)')
 * con limpieza estricta de listeners para evitar fugas de memoria.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    // Sincronizar estado inicial por si cambió antes del montaje
    setIsDesktop(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isDesktop;
}

export default useIsDesktop;
