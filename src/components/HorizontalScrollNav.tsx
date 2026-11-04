import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface HorizontalScrollNavProps {
  children: React.ReactNode;
  /** Clase CSS para el contenedor con scroll horizontal */
  className?: string;
  /** Clase CSS para la envoltura exterior que contiene los botones laterales */
  containerClassName?: string;
  /** Distancia en píxeles de cada salto de desplazamiento suave */
  scrollAmount?: number;
  /** Identificador de pruebas opcional */
  testId?: string;
  /** Referencia externa al contenedor desplazable si se desea controlar desde fuera */
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** Si se deben mostrar los chevrons fijos en los laterales o flotantes */
  variant?: "inline" | "floating";
}

/**
 * HorizontalScrollNav — Navegador Horizontal Fluido con Chevrons Laterales
 * Cumple con los estándares de ergonomía Desktop y Apple HIG de Quiral POS.
 */
export default function HorizontalScrollNav({
  children,
  className = "flex items-center gap-2 overflow-x-auto scroll-smooth custom-scrollbar pb-1",
  containerClassName = "relative flex items-center w-full min-w-0 group select-none",
  scrollAmount = 240,
  testId,
  scrollRef: externalRef,
  variant = "inline",
}: HorizontalScrollNavProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = externalRef || localRef;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Margen de tolerancia de 2px para redondeo subpixel
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, [targetRef]);

  useEffect(() => {
    checkScrollability();
    const el = targetRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => checkScrollability());
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
      resizeObserver?.disconnect();
    };
  }, [checkScrollability, targetRef, children]);

  const handleScroll = (direction: -1 | 1) => {
    const el = targetRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  if (variant === "floating") {
    return (
      <div className={containerClassName} data-testid={testId}>
        {/* Botón Flotante Izquierdo con Degradado Suave */}
        {canScrollLeft && (
          <div className="absolute left-0 inset-y-0 z-10 flex items-center pr-3 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => handleScroll(-1)}
              aria-label="Desplazar opciones hacia la izquierda"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        {/* Contenedor Desplazable */}
        <div
          ref={targetRef}
          onScroll={checkScrollability}
          className={className}
        >
          {children}
        </div>

        {/* Botón Flotante Derecho con Degradado Suave */}
        {canScrollRight && (
          <div className="absolute right-0 inset-y-0 z-10 flex items-center pl-3 bg-gradient-to-l from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => handleScroll(1)}
              aria-label="Desplazar opciones hacia la derecha"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName} data-testid={testId}>
      {/* Botón Izquierdo Inline */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll(-1)}
          aria-label="Desplazar opciones hacia la izquierda"
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 z-10"
        >
          <ChevronLeft size={15} />
        </button>
      )}

      {/* Contenedor Desplazable */}
      <div ref={targetRef} onScroll={checkScrollability} className={className}>
        {children}
      </div>

      {/* Botón Derecho Inline */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll(1)}
          aria-label="Desplazar opciones hacia la derecha"
          className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 z-10"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
