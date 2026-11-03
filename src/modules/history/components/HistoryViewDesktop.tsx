import { AlertTriangle, Check, Pencil, Search, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LottiePlayer, { EMPTY_BOX_ANIMATION } from "../../../components/LottiePlayer";
import { useInventory } from "../../../context/InventoryContext";
import { useScrollParentVirtualizer } from "../../../hooks/useScrollParentVirtualizer";
import { PaymentMethod, Sale, SaleItem } from "../../../types/domain";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";
import { HistoryTableRow } from "./HistoryTableRow";

const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Nequi", "Bancolombia", "Tarjeta"];

export interface HistoryViewDesktopProps {
  onGoToPOS?: () => void;
  onModalStateChange?: (open: boolean) => void;
}

export default function HistoryViewDesktop({
  onGoToPOS: _onGoToPOS,
  onModalStateChange,
}: HistoryViewDesktopProps) {
  const { sales, toggleItemWarranty, updateSale, deleteSale, loading } = useInventory();
  const [openSaleId, setOpenSaleId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Estado para Eliminar Venta en Diálogo de Escritorio
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState<boolean>(true);

  // Estado para Modificar Venta en Diálogo de Escritorio
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [editTotalInput, setEditTotalInput] = useState("");
  const [editNote, setEditNote] = useState("");
  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);

  // Cerrar modales de escritorio con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (saleToDelete) {
          closeDeleteModal();
        } else if (editingSale) {
          closeEditModal();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saleToDelete, editingSale]);

  const filteredSales = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => {
      const matchCustomer = sale.customerName.toLowerCase().includes(q);
      const matchNumber = String(sale.saleNumber).includes(q);
      const matchItem = sale.items.some((it) =>
        it.productName.toLowerCase().includes(q)
      );
      return matchCustomer || matchNumber || matchItem;
    });
  }, [sales, query]);

  const rowsBodyRef = useRef<HTMLTableSectionElement>(null);

  const handleToggleOpen = useCallback((saleId: string) => {
    setOpenSaleId((prev) => (prev === saleId ? null : saleId));
  }, []);

  const openEditModal = useCallback((sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSale(sale);
    setEditCustomerName(sale.customerName);
    setEditPaymentMethod(sale.paymentMethod);
    setEditItems(sale.items.map((it) => ({ ...it })));
    setEditTotalInput(String(sale.totalAmount));
    setEditNote(sale.note ?? "");
    setConfirmSaveEdit(false);
    onModalStateChange?.(true);
  }, [onModalStateChange]);

  const closeEditModal = useCallback(() => {
    setEditingSale(null);
    setConfirmSaveEdit(false);
    onModalStateChange?.(false);
  }, [onModalStateChange]);

  const openDeleteModal = useCallback((sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoreStockOnDelete(true);
    setSaleToDelete(sale);
    onModalStateChange?.(true);
  }, [onModalStateChange]);

  const closeDeleteModal = useCallback(() => {
    setSaleToDelete(null);
    onModalStateChange?.(false);
  }, [onModalStateChange]);

  const handleConfirmDelete = useCallback(() => {
    if (!saleToDelete) return;
    const deletedId = saleToDelete.id;
    deleteSale(deletedId, restoreStockOnDelete);
    if (openSaleId === deletedId) {
      setOpenSaleId(null);
    }
    setSaleToDelete(null);
    onModalStateChange?.(false);
  }, [deleteSale, onModalStateChange, openSaleId, restoreStockOnDelete, saleToDelete]);

  const handleToggleWarranty = useCallback((saleId: string, itemId: string) => {
    toggleItemWarranty(saleId, itemId);
  }, [toggleItemWarranty]);

  // Virtualización de la tabla de auditoría sobre el scroll existente (#history-scroll)
  const getSaleKey = useCallback(
    (index: number) => filteredSales[index]?.id ?? index,
    [filteredSales]
  );

  const virtual = useScrollParentVirtualizer({
    count: filteredSales.length,
    scrollElementId: "history-scroll",
    anchorRef: rowsBodyRef,
    estimateSize: 76,
    overscan: 10,
    getItemKey: getSaleKey,
  });

  const measureRowRef = virtual.enabled ? virtual.virtualizer.measureElement : undefined;

  const updateEditItemQty = (itemId: string, delta: number) => {
    setEditItems((prev) => {
      const next = prev.map((it) =>
        it.id === itemId ? { ...it, qty: Math.max(1, it.qty + delta) } : it
      );
      const newSubtotal = next.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
      setEditTotalInput(String(newSubtotal));
      return next;
    });
  };

  const updateEditItemPrice = (itemId: string, newPrice: number) => {
    setEditItems((prev) => {
      const next = prev.map((it) =>
        it.id === itemId ? { ...it, unitPrice: Math.max(0, Math.round(newPrice)) } : it
      );
      const newSubtotal = next.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
      setEditTotalInput(String(newSubtotal));
      return next;
    });
  };

  const removeEditItem = (itemId: string) => {
    if (editItems.length <= 1) return;
    setEditItems((prev) => {
      const next = prev.filter((it) => it.id !== itemId);
      const newSubtotal = next.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
      setEditTotalInput(String(newSubtotal));
      return next;
    });
  };

  const editSubtotal = useMemo(
    () => editItems.reduce((sum, it) => sum + it.qty * it.unitPrice, 0),
    [editItems]
  );

  const effectiveEditTotal = useMemo(() => {
    const parsed = parseCOPInput(editTotalInput);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : editSubtotal;
  }, [editTotalInput, editSubtotal]);

  const handleConfirmSaveEdit = () => {
    if (!editingSale) return;
    const updated: Sale = {
      ...editingSale,
      customerName: editCustomerName.trim() || "Cliente General",
      paymentMethod: editPaymentMethod,
      totalAmount: effectiveEditTotal,
      note: editNote.trim() ? editNote.trim() : undefined,
      items: editItems,
    };
    updateSale(updated);
    closeEditModal();
  };

  return (
    <div id="history-scroll" className="w-full h-full overflow-y-auto transition-colors duration-75">
      <div className="w-full px-6 lg:px-8 py-6 flex flex-col animate-in fade-in duration-200">
        {/* Header sticky con fondo sólido opaco nativo (Apple HIG) */}
        <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 pt-1 pb-3 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
          <div className="relative">
            <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm transition-colors duration-200 focus-within:border-accent">
              <Search size={18} className="text-[var(--text-secondary)] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar venta por cliente o número de ticket..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] transition-colors duration-75"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:bg-white/10 transition-colors duration-75"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla Data Grid de Historial de Escritorio */}
        <section className="pb-6">
          {loading ? (
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 shadow-xs animate-pulse space-y-4">
              <div className="h-6 w-48 rounded-lg bg-black/5 dark:bg-white/10" />
              <div className="h-10 w-full rounded-xl bg-black/5 dark:bg-white/10" />
              <div className="h-10 w-full rounded-xl bg-black/5 dark:bg-white/10" />
              <div className="h-10 w-full rounded-xl bg-black/5 dark:bg-white/10" />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-12 text-center shadow-xs select-none max-w-md mx-auto my-8 animate-in fade-in duration-150">
              <LottiePlayer
                animationData={EMPTY_BOX_ANIMATION}
                className="w-32 h-32 mx-auto mb-2"
                loop={true}
              />
              <h4 className="text-base font-bold text-[var(--text-primary)]">
                {query ? "Sin coincidencias de venta" : "Historial vacío"}
              </h4>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {query
                  ? "No se encontraron ventas asociadas al cliente o número consultado."
                  : "Aún no se han completado transacciones comerciales en este ciclo."}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
                >
                  Restablecer búsqueda
                </button>
              )}
            </div>
          ) : (
            <div
              data-testid="desktop-history-table-container"
              className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-xs"
            >
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="py-3.5 px-4 sm:px-5 w-24 sm:w-28">Ticket</th>
                    <th className="py-3.5 px-4 sm:px-5 w-44">Fecha y Hora</th>
                    <th className="py-3.5 px-4 sm:px-5 min-w-[300px]">Cliente / Detalle de Artículos</th>
                    <th className="py-3.5 px-4 sm:px-5 w-36">Método</th>
                    <th className="py-3.5 px-4 sm:px-5 w-44 text-right pr-6">Total</th>
                    <th className="py-3.5 px-4 sm:px-5 w-60 min-w-[220px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody
                  ref={rowsBodyRef}
                  className="divide-y divide-[var(--border-color)] text-sm font-medium"
                >
                  {virtual.paddingTop > 0 && (
                    <tr aria-hidden="true" data-virtual-spacer="top">
                      <td colSpan={6} style={{ height: virtual.paddingTop, padding: 0, border: 0 }} />
                    </tr>
                  )}

                  {virtual.indexes.map((idx) => {
                    const sale = filteredSales[idx];
                    if (!sale) return null;
                    return (
                      <HistoryTableRow
                        key={sale.id}
                        sale={sale}
                        isOpen={openSaleId === sale.id}
                        onToggleOpen={handleToggleOpen}
                        onOpenEdit={openEditModal}
                        onOpenDelete={openDeleteModal}
                        onToggleWarranty={handleToggleWarranty}
                        measureRef={measureRowRef}
                      />
                    );
                  })}

                  {virtual.paddingBottom > 0 && (
                    <tr aria-hidden="true" data-virtual-spacer="bottom">
                      <td colSpan={6} style={{ height: virtual.paddingBottom, padding: 0, border: 0 }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Diálogo Centrado de Escritorio para ELIMINAR Venta (Cero Bottom-Sheets Móviles) */}
      {saleToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                Eliminar Venta #{saleToDelete.saleNumber}
              </h3>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-[#ff3b30]/30 bg-[#ff3b30]/10 p-4 text-[#ff3b30]">
                <AlertTriangle size={22} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-sm">Acción destructiva permanente</p>
                  <p className="mt-0.5 opacity-90">
                    Estás a punto de eliminar el registro de la venta{" "}
                    <strong>#{saleToDelete.saleNumber}</strong> ({saleToDelete.customerName}) por{" "}
                    <strong className="tabular-nums">{formatCOP(saleToDelete.totalAmount)}</strong>.
                  </p>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 cursor-pointer hover:border-accent/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    Restituir unidades al inventario
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Devuelve automáticamente el stock descontado en esta venta a sus lotes originales.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={restoreStockOnDelete}
                  onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                  className="h-5 w-5 accent-[var(--accent-primary)] rounded cursor-pointer shrink-0"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ff3b30] text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-[#e0342a] active:scale-95 transition-all"
              >
                <Trash2 size={16} />
                <span>Sí, eliminar venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo Centrado de Escritorio para MODIFICAR Venta (Cero Bottom-Sheets Móviles) */}
      {editingSale && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                {confirmSaveEdit
                  ? `Confirmar Cambios #${editingSale.saleNumber}`
                  : `Modificar Venta #${editingSale.saleNumber}`}
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {confirmSaveEdit ? (
              <div className="space-y-4 py-2 animate-in fade-in duration-150">
                <div className="rounded-2xl border border-accent/30 bg-accent-subtle p-4 space-y-1.5">
                  <p className="text-sm font-bold text-accent">
                    ¿Confirmas la actualización de la venta #{editingSale.saleNumber}?
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Los totales financieros y las diferencias de stock en inventario se ajustarán de forma inmediata.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Cliente:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {editCustomerName.trim() || "Cliente General"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Método de pago:</span>
                    <span className="font-bold text-[var(--text-primary)]">{editPaymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Unidades totales:</span>
                    <span className="tabular-nums font-bold text-[var(--text-primary)]">
                      {editItems.reduce((acc, it) => acc + it.qty, 0)} uds
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--border-color)] text-sm">
                    <span className="font-semibold text-[var(--text-secondary)]">Nuevo Total:</span>
                    <span className="tabular-nums font-extrabold text-[var(--text-primary)]">
                      {formatCOP(effectiveEditTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    placeholder="Cliente General"
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Productos en la venta */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Productos ({editItems.length})
                  </label>
                  {editItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[var(--text-primary)] flex-1 min-w-0 line-clamp-2">
                          {item.productName}
                        </p>
                        <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shrink-0">
                          <button
                            type="button"
                            onClick={() => updateEditItemQty(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            −
                          </button>
                          <span className="tabular-nums min-w-6 text-center text-xs font-extrabold text-[var(--text-primary)]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEditItemQty(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
                            Precio unitario
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatCOP(item.unitPrice)}
                            onChange={(e) =>
                              updateEditItemPrice(item.id, parseCOPInput(e.target.value))
                            }
                            className="tabular-nums mt-0.5 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditItem(item.id)}
                            className="mt-4 text-xs font-semibold text-[#ff3b30] hover:underline px-2 py-1"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const active = editPaymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setEditPaymentMethod(method)}
                          className={`min-h-10 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? "border-accent bg-accent text-white shadow-sm"
                              : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-accent/40"
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total cobrado y Nota */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Total cobrado
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCOP(effectiveEditTotal)}
                      onChange={(e) => setEditTotalInput(String(parseCOPInput(e.target.value)))}
                      className="tabular-nums mt-1.5 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-base font-extrabold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Nota (opcional)
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Observación o ajuste..."
                      className="mt-1.5 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
              {confirmSaveEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmSaveEdit(false)}
                    className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Volver a editar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveEdit}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#30d158] text-sm font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Check size={16} />
                    <span>Confirmar cambios</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSaveEdit(true)}
                    className="px-6 py-2.5 rounded-xl bg-accent text-sm font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-95 transition-all"
                  >
                    Revisar y guardar · <span className="tabular-nums">{formatCOP(effectiveEditTotal)}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
