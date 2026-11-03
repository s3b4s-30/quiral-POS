import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { useInventory } from "../context/InventoryContext";

interface AdminCompactButtonProps {
  className?: string;
  iconOnly?: boolean;
}

/**
 * AdminCompactButton — Control compacto y adaptable de Modo Administrador (iOS HIG)
 * 
 * Características:
 * 1. Control unificado: única fuente de activación/desactivación del modo administrador.
 * 2. Adaptable: se presenta como botón de icono en pantallas estrechas (<420px) o cuando `iconOnly=true`,
 *    y como píldora con texto completo en pantallas mayores, evitando desbordamientos.
 * 3. Accesibilidad: aria-label y title explícitos para lectores de pantalla.
 * 4. Flexbox nativo: sin posicionamientos absolutos ni colisiones de capas.
 * 5. Consistencia global: acento azul nativo estándar en toda la aplicación.
 */
export default function AdminCompactButton({ className = "", iconOnly = false }: AdminCompactButtonProps) {
  const { showCosts, setShowCosts } = useInventory();

  return (
    <button
      type="button"
      onClick={() => setShowCosts((prev) => !prev)}
      title={
        showCosts
          ? "Desactivar modo administrador (ocultar costos)"
          : "Activar modo administrador (ver costos de compra)"
      }
      aria-label={showCosts ? "Desactivar modo administrador" : "Activar modo administrador"}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 select-none shrink-0 ${
        showCosts
          ? "border-accent/40 bg-accent-subtle text-accent"
          : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      } ${iconOnly ? "w-9" : "w-9 min-[420px]:w-auto min-[420px]:px-2.5"} ${className}`}
    >
      {showCosts ? (
        <Eye size={16} className="shrink-0 text-accent" />
      ) : (
        <EyeOff size={16} className="shrink-0 text-[var(--text-secondary)]" />
      )}
      {!iconOnly && (
        <span className="hidden min-[420px]:inline whitespace-nowrap leading-none transition-none">
          Modo Administrador
        </span>
      )}
    </button>
  );
}

