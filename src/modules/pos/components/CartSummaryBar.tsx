import { ArrowRight, ShoppingCart } from "lucide-react";
import { formatCOP } from "../../../utils/formatters";

export interface CartSummaryBarProps {
  units: number;
  total: number;
  onCheckout: () => void;
}

export default function CartSummaryBar({ units, total, onCheckout }: CartSummaryBarProps) {
  if (units <= 0) return null;

  return (
    <div
      role="region"
      aria-label="Resumen de compra actual"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-30 mx-auto max-w-sm pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <button
        type="button"
        onClick={onCheckout}
        aria-label={`Ver carrito: ${units} ${units === 1 ? "producto" : "productos"}, total ${formatCOP(total)}. Toca para cobrar.`}
        className="w-full flex items-center justify-between gap-2.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2.5 sm:p-3 text-[var(--text-primary)] shadow-2xl shadow-black/15 dark:shadow-black/50 active:scale-[0.98] transition-transform duration-100 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* Contenido Izquierdo: Ícono circular de acento dinámico + Textos */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/20 transition-colors duration-200"
            aria-hidden="true"
          >
            <ShoppingCart size={19} />
          </span>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-bold leading-tight text-[var(--text-primary)]">
              {units} {units === 1 ? "producto" : "productos"}
            </p>
            <p className="truncate text-xs text-[var(--text-secondary)] leading-tight mt-0.5">
              Toca para revisar o cobrar
            </p>
          </div>
        </div>

        {/* Contenido Derecho: Botón píldora de acento dinámico, monto y flecha en círculo blanco */}
        <span
          className="tabular-nums flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full bg-accent pl-3 pr-2 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-accent/30 whitespace-nowrap transition-colors duration-200"
          aria-hidden="true"
        >
          {formatCOP(total)}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-accent shadow-sm transition-colors duration-200">
            <ArrowRight size={12} className="stroke-[3]" />
          </span>
        </span>
      </button>
    </div>
  );
}
