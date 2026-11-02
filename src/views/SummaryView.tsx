import { BarChart2, ChevronRight, Lock } from "lucide-react";
import React, { useMemo, useState } from "react";
import CycleClosingModal from "../components/CycleClosingModal";
import SalesPerformanceModal from "../components/SalesPerformanceModal";
import { useInventory } from "../context/InventoryContext";
import { formatCOP, formatFullDate } from "../utils/formatters";

interface SummaryViewProps {
  onModalStateChange?: (open: boolean) => void;
}

export default function SummaryView({ onModalStateChange }: SummaryViewProps) {
  const { sales, products, closures, createClosure, showCosts, loading } = useInventory();

  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isClosingCycleOpen, setIsClosingCycleOpen] = useState(false);

  const handleOpenPerformance = () => {
    setIsPerformanceOpen(true);
    onModalStateChange?.(true);
  };

  const handleClosePerformance = () => {
    setIsPerformanceOpen(false);
    onModalStateChange?.(false);
  };

  const handleOpenCycleClose = () => {
    setIsClosingCycleOpen(true);
    onModalStateChange?.(true);
  };

  const handleCloseCycleClose = () => {
    setIsClosingCycleOpen(false);
    onModalStateChange?.(false);
  };

  // Cálculo financiero dinámico de métricas (Ingresos, Utilidad, Inventario)
  const totals = useMemo(() => {
    const revenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

    const cost = sales.reduce((acc, s) => {
      const saleCost = s.items.reduce((sAcc, item) => {
        let itemCost = item.unitCostSnapshot;
        if (itemCost === undefined) {
          const prod = products.find((p) => p.id === item.productId);
          const totalStock = prod?.batches.reduce((sum, b) => sum + b.stock, 0) || 0;
          const totalBatchCost = prod?.batches.reduce((sum, b) => sum + b.cost * b.stock, 0) || 0;
          itemCost = totalStock > 0 ? Math.round(totalBatchCost / totalStock) : prod?.batches[0]?.cost || 0;
        }
        return sAcc + item.qty * itemCost;
      }, 0);
      return acc + saleCost;
    }, 0);

    const stockValue = products.reduce((acc, p) => {
      return acc + p.batches.reduce((bAcc, b) => bAcc + b.cost * b.stock, 0);
    }, 0);

    return {
      revenue,
      profit: revenue - cost,
      stockValue,
    };
  }, [sales, products]);

  return (
    <div
      id="summary-scroll"
      className="quiral-scroll-container transition-colors duration-75"
    >
      <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4 pt-3 pb-6">
        {/* 1. Dashboard Principal de Métricas (Tokens del Sistema Apple HIG) */}
        {loading ? (
          <section className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm animate-pulse min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Ingresos
              </span>
              <div className="h-7 w-28 rounded-lg bg-black/5 dark:bg-white/10 mt-1.5" />
            </div>
            <div className="rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm animate-pulse min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Utilidad
              </span>
              <div className="h-7 w-24 rounded-lg bg-black/5 dark:bg-white/10 mt-1.5" />
            </div>
            <div className="col-span-1 min-[360px]:col-span-2 md:col-span-1 rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm animate-pulse min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Inventario
              </span>
              <div className="h-7 w-24 rounded-lg bg-black/5 dark:bg-white/10 mt-1.5" />
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Tarjeta Ingresos */}
            <div className="rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm transition-colors duration-75 min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Ingresos
              </span>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate text-[var(--text-primary)] mt-1">
                {formatCOP(totals.revenue)}
              </p>
            </div>

            {/* Tarjeta Utilidad (Con modo privacidad ojito) */}
            <div className="rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm transition-colors duration-75 min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Utilidad
              </span>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate text-emerald-600 dark:text-emerald-400 mt-1">
                {!showCosts ? "••••••" : formatCOP(totals.profit)}
              </p>
            </div>

            {/* Tarjeta Inventario */}
            <div className="col-span-1 min-[360px]:col-span-2 md:col-span-1 rounded-2xl p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm transition-colors duration-75 min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] block">
                Inventario
              </span>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate text-amber-500 mt-1">
                {!showCosts ? "••••••" : formatCOP(totals.stockValue)}
              </p>
            </div>
          </section>
        )}

        {/* 2. Tarjetas de Acción / Navegación (Estilo iOS Settings Row) */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Botón 1: Más Vendidos y Devueltos */}
          <button
            type="button"
            onClick={handleOpenPerformance}
            className="w-full rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <BarChart2 size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate">
                  Más Vendidos y Devueltos
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  Filtrar por ciclo actual o históricos
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--text-secondary)] shrink-0" />
          </button>

          {/* Botón 2: Cerrar Ciclo */}
          <button
            type="button"
            onClick={handleOpenCycleClose}
            className="w-full rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Lock size={19} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate">
                  Cerrar Ciclo
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  Arqueo de caja y congelación de métricas
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--text-secondary)] shrink-0" />
          </button>
        </section>

        {/* 3. Sección HISTORIAL DE CIERRES */}
        <section className="mt-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase mb-2.5">
            HISTORIAL DE CIERRES ({loading ? "..." : closures.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-pulse space-y-2.5 h-20">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-32 rounded bg-black/5 dark:bg-white/10" />
                    <div className="h-4 w-20 rounded-full bg-black/5 dark:bg-white/10" />
                  </div>
                  <div className="h-3 w-44 rounded bg-black/5 dark:bg-white/10" />
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-pulse space-y-2.5 h-20">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-32 rounded bg-black/5 dark:bg-white/10" />
                    <div className="h-4 w-20 rounded-full bg-black/5 dark:bg-white/10" />
                  </div>
                  <div className="h-3 w-44 rounded bg-black/5 dark:bg-white/10" />
                </div>
              </>
            ) : closures.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 text-center shadow-sm select-none">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] mb-2.5">
                  <Lock size={22} className="opacity-70" />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Sin cierres de ciclo registrados
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
                  Los arqueos de caja y congelación de métricas aparecerán listados aquí cuando se complete un cierre.
                </p>
              </div>
            ) : (
              closures.map((closure) => (
                <article
                  key={closure.id}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm transition-colors duration-75 space-y-2"
                >
                  {/* Encabezado: Rango de fechas en negrita y badge de fecha de ejecución */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate">
                      {closure.periodLabel}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] font-medium whitespace-nowrap shrink-0">
                      {formatFullDate(closure.closedAt)}
                    </span>
                  </div>

                  {/* Fila Inferior: Vendido y Utilidad en verde con protección ante cifras largas */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-1.5 border-t border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] font-medium">
                      Vendido:{" "}
                      <strong className="text-[var(--text-primary)] font-bold tabular-nums">
                        {formatCOP(closure.totalSold)}
                      </strong>
                    </span>
                    <span className="text-emerald-500 font-semibold tabular-nums ml-auto">
                      Utilidad: {!showCosts ? "••••••" : `+${formatCOP(closure.netProfit)}`}
                    </span>
                  </div>

                  {/* Nota opcional de arqueo */}
                  {closure.differenceNote && (
                    <p className="text-xs text-[var(--text-secondary)] pt-1 italic border-t border-[var(--border-color)]">
                      Nota: {closure.differenceNote}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modal 1: Rendimiento de Ventas */}
      <SalesPerformanceModal
        isOpen={isPerformanceOpen}
        onClose={handleClosePerformance}
        closures={closures}
        sales={sales}
        products={products}
        showCosts={showCosts}
      />

      {/* Modal 2: Cierre de Ciclo */}
      <CycleClosingModal
        isOpen={isClosingCycleOpen}
        onClose={handleCloseCycleClose}
        sales={sales}
        products={products}
        showCosts={showCosts}
        onConfirmClose={createClosure}
      />
    </div>
  );
}
