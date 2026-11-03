import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

/**
 * Umbral a partir del cual las tablas de escritorio activan virtualización de DOM.
 * Por debajo de este número de filas se renderiza la lista completa (coste despreciable
 * y comportamiento 100% idéntico al de una tabla tradicional).
 */
export const DESKTOP_VIRTUALIZATION_THRESHOLD = 40;

export interface UseScrollParentVirtualizerOptions {
  /** Número total de filas/ítems lógicos. */
  count: number;
  /** `id` del contenedor scrolleable de la vista (`#inventory-scroll`, `#history-scroll`). */
  scrollElementId: string;
  /** Elemento que marca el inicio de la lista dentro del contenedor (p. ej. el `<tbody>` de filas). */
  anchorRef: RefObject<HTMLElement>;
  /** Altura estimada en px de cada ítem antes de ser medido. */
  estimateSize: number;
  /** Ítems extra renderizados fuera del viewport para un scroll sin parpadeos. */
  overscan?: number;
  /** Clave estable por índice (id de producto/venta) para conservar mediciones al reordenar. */
  getItemKey?: (index: number) => string | number;
  /** Fuerza la desactivación (por defecto se activa al superar el umbral). */
  disabled?: boolean;
}

export interface ScrollParentVirtualizerResult {
  enabled: boolean;
  virtualizer: Virtualizer<HTMLElement, Element>;
  /** Índices a renderizar (todos si la virtualización está inactiva). */
  indexes: number[];
  /** Relleno superior/inferior en px para los espaciadores de tabla. */
  paddingTop: number;
  paddingBottom: number;
}

/**
 * Virtualización de tablas de escritorio sobre el contenedor de scroll YA existente
 * de la vista (cero doble-scroll). Calcula dinámicamente el `scrollMargin` (distancia
 * entre el tope del contenedor y el inicio de la lista) y expone espaciadores
 * superior/inferior para mantener el layout nativo de `<table>`.
 */
export function useScrollParentVirtualizer({
  count,
  scrollElementId,
  anchorRef,
  estimateSize,
  overscan = 10,
  getItemKey,
  disabled = false,
}: UseScrollParentVirtualizerOptions): ScrollParentVirtualizerResult {
  const enabled = !disabled && count > DESKTOP_VIRTUALIZATION_THRESHOLD;
  const [scrollMargin, setScrollMargin] = useState(0);

  const getScrollElement = useCallback(
    () => document.getElementById(scrollElementId),
    [scrollElementId]
  );

  // Medir la distancia del ancla al tope del contenido scrolleable y re-medir ante cambios de layout
  useLayoutEffect(() => {
    if (!enabled) return;
    const scrollEl = getScrollElement();
    const anchor = anchorRef.current;
    if (!scrollEl || !anchor) return;

    const measure = () => {
      const next = Math.round(
        anchor.getBoundingClientRect().top -
          scrollEl.getBoundingClientRect().top +
          scrollEl.scrollTop
      );
      setScrollMargin((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scrollEl);
    if (scrollEl.firstElementChild) ro.observe(scrollEl.firstElementChild);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled, getScrollElement, anchorRef]);

  const virtualizer = useVirtualizer<HTMLElement, Element>({
    count: enabled ? count : 0,
    getScrollElement,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
    getItemKey,
  });

  if (!enabled) {
    return {
      enabled,
      virtualizer,
      indexes: Array.from({ length: count }, (_, i) => i),
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  const items = virtualizer.getVirtualItems();
  const first = items[0];
  const last = items[items.length - 1];
  const paddingTop = first ? Math.max(0, first.start - scrollMargin) : 0;
  const paddingBottom = last
    ? Math.max(0, virtualizer.getTotalSize() - (last.end - scrollMargin))
    : 0;

  return {
    enabled,
    virtualizer,
    indexes: items.map((it) => it.index),
    paddingTop,
    paddingBottom,
  };
}
