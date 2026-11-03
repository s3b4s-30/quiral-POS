import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

export interface ModalSheetProps {
  onClose: () => void;
  onStartClose?: () => void;
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  enableDragToDismiss?: boolean;
}

export default function ModalSheet({
  onClose,
  onStartClose,
  title,
  headerLeft,
  headerRight,
  children,
  footer,
  className = "",
  contentClassName = "",
  maxWidth = "max-w-lg",
  enableDragToDismiss = true,
}: ModalSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Cerrar con animación fluida e instantánea (140ms ease-out, sincronizando restauración inmediata de interfaz)
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onStartClose?.();
    setTimeout(() => {
      onClose();
    }, 140);
  };

  // Bloqueo de scroll del body y restauración limpia al desmontar
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.classList.add("modal-open");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Gesto táctil para arrastre en móvil (iOS Safari & PWA)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!enableDragToDismiss || isClosing) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15); // Resistencia elástica hacia arriba
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const duration = Math.max(Date.now() - startTimeRef.current, 1);
    const velocity = deltaY / duration; // px por milisegundo

    // Criterio de despido: arrastre > 80px o swipe rápido hacia abajo
    if (deltaY > 80 || (velocity > 0.35 && deltaY > 25)) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  // Gesto de ratón en escritorio para depuración y pruebas
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableDragToDismiss || isClosing) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) return;

    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);

    const handleMouseMove = (moveEv: MouseEvent) => {
      currentYRef.current = moveEv.clientY;
      const deltaY = currentYRef.current - startYRef.current;
      if (deltaY > 0) {
        setDragY(deltaY);
      } else {
        setDragY(deltaY * 0.15);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      isDraggingRef.current = false;
      setIsDragging(false);

      const deltaY = currentYRef.current - startYRef.current;
      const duration = Math.max(Date.now() - startTimeRef.current, 1);
      const velocity = deltaY / duration;

      if (deltaY > 80 || (velocity > 0.35 && deltaY > 25)) {
        handleClose();
      } else {
        setDragY(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/60 dark:bg-black/75 sm:items-center sm:justify-center p-0 sm:p-4 touch-none overscroll-none select-none transition-opacity duration-150 ease-out will-change-[opacity] ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"
      }`}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-sheet-title"
        className={`flex max-h-[calc(100dvh-2.25rem)] sm:max-h-[85vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[32px] sm:rounded-[32px] border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-2xl modal-sheet-dialog ${className}`}
        style={{
          transform: isClosing
            ? "translateY(100%)"
            : isDragging
            ? `translateY(${dragY}px)`
            : "translateY(0px)",
          transition: isDragging
            ? "none"
            : isClosing
            ? "transform 0.14s cubic-bezier(0.32, 0.72, 0, 1)"
            : "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: isDragging || isClosing ? "transform" : "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera persistente y zona táctil de arrastre (sticky top-0, fondo sólido HIG) */}
        <div
          className="sticky top-0 z-30 shrink-0 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] select-none cursor-grab active:cursor-grabbing touch-none transition-colors duration-75"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Píldora táctil de arrastre (Handle estilo iOS ajustado) */}
          <div className="flex justify-center pt-3 pb-1.5 shrink-0">
            <div className="h-1 w-9 rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors duration-75 pointer-events-none" />
          </div>

          {/* Barra de cabecera con proporción superior optimizada */}
          <header className="relative flex items-center justify-between px-4 pt-1 pb-3">
            {headerLeft !== undefined ? (
              headerLeft
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-accent transition-colors duration-200 hover:bg-black/10 dark:bg-white/10"
                aria-label="Cerrar modal"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <h2 id="modal-sheet-title" className="text-base font-bold tracking-tight text-[var(--text-primary)] pointer-events-none transition-colors duration-75">
              {title}
            </h2>

            {headerRight ? (
              headerRight
            ) : (
              <div className="w-9 pointer-events-none" />
            )}
          </header>
        </div>

        {/* Contenedor de contenido desplazable independiente */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3.5 ${
            footer
              ? "pb-4 sm:pb-5"
              : "pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:pb-7"
          } ${contentClassName}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>

        {/* Footer persistente con safe-area inferior ajustada cerca del borde */}
        {footer && (
          <footer className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-3 shadow-lg">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
