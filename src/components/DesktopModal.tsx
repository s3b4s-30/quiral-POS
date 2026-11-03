import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DesktopModalProps {
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
}

/**
 * DesktopModal — Contenedor Modal Centrado de Alta Densidad para Escritorio (>= 768px).
 * Erradica por completo el patrón bottom-sheet móvil en PC:
 * - Sin barras de arrastre táctiles (drag handles).
 * - Sin eventos táctiles ni gestos swipe.
 * - Centrado nativo en pantalla con cabecera limpia, botón [✕] / Esc y área con scroll de ratón.
 */
export default function DesktopModal({
  onClose,
  onStartClose,
  title,
  headerLeft,
  headerRight,
  children,
  footer,
  className = "",
  contentClassName = "",
  maxWidth = "max-w-3xl lg:max-w-4xl",
}: DesktopModalProps) {
  const handleClose = () => {
    onStartClose?.();
    onClose();
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[88vh] flex flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Limpia de Escritorio */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {headerLeft}
            <h2
              id="desktop-modal-title"
              className="text-lg lg:text-xl font-extrabold tracking-tight text-[var(--text-primary)] truncate"
            >
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              aria-label="Cerrar modal"
              title="Cerrar modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Área de Contenido Scrolleable sin restricciones táctiles */}
        <div className={`flex-1 min-h-0 overflow-y-auto px-6 py-5 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer Persistente de Escritorio */}
        {footer && (
          <footer className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 py-3.5 shadow-lg">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
