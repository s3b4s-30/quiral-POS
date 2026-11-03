import {
  AlertTriangle,
  LogOut,
  Moon,
  MoreHorizontal,
  Store,
  Sun,
  SunMoon,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInventory } from "../context/InventoryContext";

export type Theme = "auto" | "light" | "dark";

interface TopMenuProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenSuppliers?: () => void;
  onOpenProfile?: () => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
}

export default function TopMenu({
  theme,
  onThemeChange,
  onOpenSuppliers,
  onOpenProfile,
  onOpenProfileSecurity,
  onLogout,
}: TopMenuProps) {
  const [open, setOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { suppliers, userProfile, isDemoUser } = useInventory();

  const updatePopoverPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPopoverCoords({
      top: Math.round(rect.bottom + 8),
      right: Math.max(12, Math.round(window.innerWidth - rect.right)),
    });
  };

  const handleToggleOpen = () => {
    if (!open) {
      updatePopoverPosition();
    }
    setOpen((prev) => !prev);
  };

  const handleDismissBackdrop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  // Bloquear scroll e interacciones de fondo cuando el menú superior está abierto
  useEffect(() => {
    if (!open) return;

    updatePopoverPosition();

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleResize = () => {
      updatePopoverPosition();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const handleProfileClick = () => {
    setOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
    } else if (onOpenProfileSecurity) {
      onOpenProfileSecurity();
    }
  };

  return (
    <div className="theme-menu relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Abrir configuración y menú"
        title="Configuración"
        aria-expanded={open}
        aria-controls="top-menu-popover"
        onClick={handleToggleOpen}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-accent shadow-sm transition-colors duration-200 hover:opacity-80 active:scale-95"
      >
        {open ? <X size={20} /> : <MoreHorizontal size={20} />}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70]"
            data-testid="top-menu-portal-layer"
          >
            {/* Overlay de pantalla completa (escapa del backdrop-filter del TopHeader vía Portal) */}
            <button
              type="button"
              aria-label="Cerrar menú de configuración"
              data-testid="top-menu-backdrop"
              className="fixed inset-0 z-50 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px] touch-none"
              onClick={handleDismissBackdrop}
            />

            {/* Menú flotante en capa superior respecto al overlay */}
            <div
              ref={popoverRef}
              id="top-menu-popover"
              role="menu"
              style={
                popoverCoords
                  ? {
                      top: `${popoverCoords.top}px`,
                      right: `${popoverCoords.right}px`,
                    }
                  : {
                      top: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
                      right: "1rem",
                    }
              }
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[60] w-72 origin-top-right rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Información de Tienda, Usuario y Botón de Cierre Explícito */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-[var(--text-primary)] truncate transition-colors duration-75">
                        {userProfile?.storeName || "Quiral POS"}
                      </h3>
                      <span className="shrink-0 rounded-md bg-accent-subtle px-1.5 py-0.5 text-[10px] font-bold text-accent transition-colors duration-200">
                        {userProfile?.role === "owner" ? "Dueño" : "Vendedor"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {userProfile?.username ? `@${userProfile.username}` : "Usuario activo"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar menú"
                    title="Cerrar menú"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-transform"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Alerta de Modo Demo 30/30 */}
                {isDemoUser && (
                  <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Modo Demo 30/30 (Inseguro)</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                      Entorno de prueba pública. No uses contraseñas ni datos sensibles reales.
                    </p>
                  </div>
                )}
              </div>

              <div className="my-2 border-t border-[var(--border-color)]" />

              {/* Fila Proveedores */}
              {onOpenSuppliers && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenSuppliers();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-none hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle text-accent transition-colors duration-200">
                      <Users size={16} />
                    </div>
                    <span className="transition-none">Proveedores</span>
                  </div>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black/10 px-1.5 text-xs font-bold text-[var(--text-secondary)] dark:bg-white/10 transition-colors duration-75">
                    {suppliers.length}
                  </span>
                </button>
              )}

              {/* Fila Perfil */}
              {(onOpenProfile || onOpenProfileSecurity) && (
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-none hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Store size={16} />
                    </div>
                    <span className="transition-none">Perfil</span>
                  </div>
                </button>
              )}

              <div className="my-2 border-t border-[var(--border-color)]" />

              {/* Selector de Apariencia */}
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors duration-75">
                  Apariencia
                </p>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => onThemeChange("auto")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      theme === "auto"
                        ? "bg-accent text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <SunMoon size={14} /> Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange("light")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      theme === "light"
                        ? "bg-accent text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Sun size={14} /> Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange("dark")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-accent text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Moon size={14} /> Oscuro
                  </button>
                </div>
              </div>

              {/* Fila Cerrar sesión */}
              <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-[#ff3b30]/10 px-3 py-2.5 text-left text-sm font-semibold text-[#ff3b30] transition-colors duration-75 hover:bg-[#ff3b30]/15"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-[var(--text-secondary)]/70 transition-none">
                Quiral · by Elytra
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
