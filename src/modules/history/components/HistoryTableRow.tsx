import { Pencil, Trash2 } from "lucide-react";
import React, { memo } from "react";
import { Sale } from "../../../types/domain";
import {
  formatCOP,
  formatDateWithTime,
  formatShortDate,
  getWarrantyStatus,
} from "../../../utils/formatters";

export interface HistoryTableRowProps {
  sale: Sale;
  isOpen: boolean;
  onToggleOpen: (id: string) => void;
  onOpenEdit: (sale: Sale, e: React.MouseEvent) => void;
  onOpenDelete: (sale: Sale, e: React.MouseEvent) => void;
  onToggleWarranty: (saleId: string, itemId: string) => void;
  measureRef?: (el: HTMLTableRowElement | null) => void;
}

export const HistoryTableRow = memo(
  function HistoryTableRow({
    sale,
    isOpen,
    onToggleOpen,
    onOpenEdit,
    onOpenDelete,
    onToggleWarranty,
    measureRef,
  }: HistoryTableRowProps) {
    const totalUnits = sale.items.reduce((s, it) => s + it.qty, 0);

    return (
      <React.Fragment>
        <tr
          ref={measureRef}
          data-testid={`desktop-history-row-${sale.id}`}
          onClick={() => onToggleOpen(sale.id)}
          className="group hover:bg-black/[0.035] dark:hover:bg-white/[0.045] cursor-pointer transition-all duration-150"
        >
          <td className="py-3.5 px-3 sm:px-4 w-20 sm:w-24">
            <span className="tabular-nums font-black text-xs sm:text-sm text-accent bg-accent-subtle px-2 py-0.5 rounded-lg">
              #{sale.saleNumber}
            </span>
          </td>
          <td className="py-3.5 px-3 sm:px-4 w-36 sm:w-40 tabular-nums text-xs sm:text-sm font-bold text-[var(--text-secondary)] whitespace-nowrap">
            {formatDateWithTime(sale.createdAt) ||
              formatShortDate(sale.createdAt)}
          </td>
          <td className="py-3.5 px-3 sm:px-4 min-w-0">
            <p className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug truncate">
              {sale.customerName}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
              {totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}:{" "}
              {sale.items
                .map((it) => `${it.qty}x ${it.productName}`)
                .join(", ")}
            </p>
            {sale.note && (
              <p className="text-xs italic text-[var(--text-secondary)] mt-1 truncate">
                Nota: {sale.note}
              </p>
            )}
          </td>
          <td className="py-3.5 px-3 sm:px-4 w-28 sm:w-32 whitespace-nowrap">
            <span className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1 text-xs font-bold text-[var(--text-primary)]">
              {sale.paymentMethod}
            </span>
          </td>
          <td className="py-3.5 px-3 sm:px-4 w-32 sm:w-36 text-right whitespace-nowrap pr-4">
            <span className="tabular-nums font-black text-base sm:text-lg lg:text-xl text-[var(--text-primary)] leading-none select-none">
              {formatCOP(sale.totalAmount)}
            </span>
          </td>
          <td className="py-3.5 px-3 sm:px-4 w-48 sm:w-52 text-right whitespace-nowrap pr-3">
            <div
              className="flex items-center justify-end gap-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => onOpenEdit(sale, e)}
                aria-label={`Modificar venta #${sale.saleNumber}`}
                title="Modificar venta"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-transparent bg-accent-subtle px-2.5 text-xs font-bold text-accent hover:border-accent-subtle active:scale-95 transition-all"
              >
                <Pencil size={13} />
                <span>Modificar</span>
              </button>
              <button
                type="button"
                onClick={(e) => onOpenDelete(sale, e)}
                aria-label={`Eliminar venta #${sale.saleNumber}`}
                title="Eliminar venta"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-transparent bg-red-500/10 px-2.5 text-xs font-bold text-red-500 hover:border-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 size={13} />
                <span>Eliminar</span>
              </button>
            </div>
          </td>
        </tr>

        {/* Desglose Multi-Columna de Artículos y Garantías (Cero Carruseles Cortados) */}
        {isOpen && (
          <tr className="bg-black/[0.015] dark:bg-white/[0.015]">
            <td colSpan={6} className="py-4 px-6">
              <div className="space-y-3 border-l-2 border-accent pl-4 py-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                  Desglose del Ticket #{sale.saleNumber} ({sale.items.length}{" "}
                  {sale.items.length === 1 ? "referencia" : "referencias"} ·{" "}
                  {totalUnits} unidades)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sale.items.map((item) => {
                    const w = getWarrantyStatus(
                      sale.createdAt,
                      item.warrantyDays,
                      item.warrantyClaimed
                    );

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 space-y-2 shadow-xs hover:border-accent/40 transition-all duration-150"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                              {item.qty}x {item.productName}
                            </p>
                            <p className="tabular-nums text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                              {formatCOP(item.unitPrice)} c/u
                            </p>
                          </div>
                          <span className="tabular-nums text-sm font-black text-[var(--text-primary)]">
                            {formatCOP(item.unitPrice * item.qty)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-color)]/60 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold text-[11px] ${
                              w.status === "claimed"
                                ? "bg-[#ff3b30]/15 text-[#ff3b30]"
                                : w.status === "expired"
                                  ? "bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]"
                                  : "bg-[#30d158]/15 text-[#30d158]"
                            }`}
                          >
                            {w.label}
                          </span>

                          {w.status !== "expired" && (
                            <button
                              type="button"
                              onClick={() => onToggleWarranty(sale.id, item.id)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold active:scale-95 transition-all ${
                                item.warrantyClaimed
                                  ? "bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                  : "bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30]/25"
                              }`}
                            >
                              {item.warrantyClaimed
                                ? "Revertir reclamo"
                                : "Marcar reclamo"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  },
  (prev, next) =>
    prev.sale === next.sale &&
    prev.isOpen === next.isOpen &&
    prev.onToggleOpen === next.onToggleOpen &&
    prev.onOpenEdit === next.onOpenEdit &&
    prev.onOpenDelete === next.onOpenDelete &&
    prev.onToggleWarranty === next.onToggleWarranty &&
    prev.measureRef === next.measureRef
);
