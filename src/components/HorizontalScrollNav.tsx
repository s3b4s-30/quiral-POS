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
  /** Si se deben mostrar los chevrons fijos en los laterales, flotantes o ninguno */
  variant?: "inline" | "floating" | "none";
  /** Si se debe habilitar el scroll por arrastre (Grab & Drag) con el cursor */
  enableDrag?: boolean;
}

/**
 * HorizontalScrollNav — Navegador Horizontal Fluido con Chevrons Laterales o Grab & Drag
 * Cumple con los estándares de ergonomía Desktop y Apple HIG de Quiral POS.
 */
export default function HorizontalScrollNav({
  children,
  className = "flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1",
  containerClassName = "relative flex items-center w-full min-w-0 select-none",
  scrollAmount = 240,
  testId,
  scrollRef: externalRef,
  variant = "none",
  enableDrag = true,
}: HorizontalScrollNavProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = externalRef || localRef;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableDrag || e.button !== 0) return;
    const el = targetRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragScrollLeftRef.current = el.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableDrag || !isDraggingRef.current) return;
    const el = targetRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.5;
    dragDistanceRef.current = Math.abs(x - dragStartXRef.current);
    el.scrollLeft = dragScrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (enableDrag && dragDistanceRef.current > 5) {
      e.stopPropagation();
      e.preventDefault();
      dragDistanceRef.current = 0;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!enableDrag) return;
    const el = targetRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
    }
  };

  if (variant === "none") {
    return (
      <div className={containerClassName} data-testid={testId}>
        <div
          ref={targetRef}
          onScroll={checkScrollability}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClickCapture}
          onWheel={handleWheel}
          className={`${className} ${
            enableDrag ? "cursor-grab active:cursor-grabbing select-none" : ""
          }`}
        >
          {children}
        </div>
      </div>
    );
  }

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
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        {/* Contenedor Desplazable */}
        <div
          ref={targetRef}
          onScroll={checkScrollability}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClickCapture}
          onWheel={handleWheel}
          className={`${className} ${
            enableDrag ? "cursor-grab active:cursor-grabbing select-none" : ""
          }`}
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
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 cursor-pointer"
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
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 z-10 cursor-pointer"
        >
          <ChevronLeft size={15} />
        </button>
      )}

      {/* Contenedor Desplazable */}
      <div
        ref={targetRef}
        onScroll={checkScrollability}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={handleClickCapture}
        onWheel={handleWheel}
        className={`${className} ${
          enableDrag ? "cursor-grab active:cursor-grabbing select-none" : ""
        }`}
      >
        {children}
      </div>

      {/* Botón Derecho Inline */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll(1)}
          aria-label="Desplazar opciones hacia la derecha"
          className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 z-10 cursor-pointer"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
