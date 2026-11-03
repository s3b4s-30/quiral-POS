import { AlertTriangle, Check, ChevronDown, ChevronUp, Pencil, Search, Trash2, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import LottiePlayer, { EMPTY_BOX_ANIMATION } from "../components/LottiePlayer";
import ModalSheet from "../components/ModalSheet";
import { useInventory } from "../context/InventoryContext";
import { PaymentMethod, Sale, SaleItem } from "../types/domain";
import { formatCOP, formatDateWithTime, formatShortDate, getWarrantyStatus, parseCOPInput } from "../utils/formatters";

const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Nequi", "Bancolombia", "Tarjeta"];

interface HistoryViewProps {
  onGoToPOS?: () => void;
  onModalStateChange?: (open: boolean) => void;
}

export default function HistoryView({
  onGoToPOS: _onGoToPOS,
  onModalStateChange,
}: HistoryViewProps) {
  const { sales, toggleItemWarranty, updateSale, deleteSale, loading } = useInventory();
  const [openSaleId, setOpenSaleId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Detección reactiva de viewport escritorio (>= 768px)
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktopViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  // Estado para Eliminar Venta (con Modal de Confirmación obligatorio)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState<boolean>(true);

  // Estado para Modificar Venta (con paso de Confirmación obligatorio)
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [editTotalInput, setEditTotalInput] = useState("");
  const [editNote, setEditNote] = useState("");
  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);

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

  const openEditModal = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSale(sale);
    setEditCustomerName(sale.customerName);
    setEditPaymentMethod(sale.paymentMethod);
    setEditItems(sale.items.map((it) => ({ ...it })));
    setEditTotalInput(String(sale.totalAmount));
    setEditNote(sale.note ?? "");
    setConfirmSaveEdit(false);
    onModalStateChange?.(true);
  };

  const closeEditModal = () => {
    setEditingSale(null);
    setConfirmSaveEdit(false);
    onModalStateChange?.(false);
  };

  const openDeleteModal = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoreStockOnDelete(true);
    setSaleToDelete(sale);
    onModalStateChange?.(true);
  };

  const closeDeleteModal = () => {
    setSaleToDelete(null);
    onModalStateChange?.(false);
  };

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    const deletedId = saleToDelete.id;
    deleteSale(deletedId, restoreStockOnDelete);
    if (openSaleId === deletedId) {
      setOpenSaleId(null);
    }
    setSaleToDelete(null);
  };

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
    <div id="history-scroll" className="quiral-scroll-container transition-colors duration-75">
      <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4">
        {/* Header sticky con fondo sólido opaco nativo (Apple HIG) */}
        <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2.5 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
          <div className="relative">
            <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm transition-colors duration-200 focus-within:border-accent">
              <Search size={18} className="text-[var(--text-secondary)] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar venta por cliente o #..."
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

        {/* Listado de Ventas en Historial: Tabla Data Grid en Escritorio (>= 768px) o Tarjetas en Móvil (< 768px) */}
        {isDesktopViewport ? (
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                      <th className="py-3.5 px-5 w-28">Ticket</th>
                      <th className="py-3.5 px-5 w-48">Fecha y Hora</th>
                      <th className="py-3.5 px-5 min-w-[240px]">Cliente / Referencias</th>
                      <th className="py-3.5 px-5 w-36">Método</th>
                      <th className="py-3.5 px-5 w-40 text-right">Total</th>
                      <th className="py-3.5 px-5 w-40 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-sm font-medium">
                    {filteredSales.map((sale) => {
                      const isOpen = openSaleId === sale.id;
                      const totalUnits = sale.items.reduce((s, it) => s + it.qty, 0);

                      return (
                        <React.Fragment key={sale.id}>
                          <tr
                            data-testid={`desktop-history-row-${sale.id}`}
                            onClick={() => setOpenSaleId(isOpen ? null : sale.id)}
                            className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="py-4 px-5">
                              <span className="tabular-nums font-black text-sm text-accent bg-accent-subtle px-2.5 py-1 rounded-lg">
                                #{sale.saleNumber}
                              </span>
                            </td>
                            <td className="py-4 px-5 tabular-nums text-xs sm:text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDateWithTime(sale.createdAt) || formatShortDate(sale.createdAt)}
                            </td>
                            <td className="py-4 px-5 min-w-[240px]">
                              <p className="text-base sm:text-[17px] font-bold text-[var(--text-primary)] leading-snug">
                                {sale.customerName}
                              </p>
                              <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-0.5">
                                {totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}:{" "}
                                {sale.items.map((it) => `${it.qty}x ${it.productName}`).join(", ")}
                              </p>
                              {sale.note && (
                                <p className="text-xs italic text-[var(--text-secondary)] mt-1">
                                  Nota: {sale.note}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <span className="tabular-nums font-black text-base sm:text-lg text-[var(--text-primary)] leading-none">
                                {formatCOP(sale.totalAmount)}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => openEditModal(sale, e)}
                                  aria-label={`Modificar venta #${sale.saleNumber}`}
                                  title="Modificar venta"
                                  className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-transparent bg-accent-subtle px-3 text-xs font-bold text-accent hover:border-accent-subtle active:scale-95 transition-all"
                                >
                                  <Pencil size={13} />
                                  <span>Modificar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => openDeleteModal(sale, e)}
                                  aria-label={`Eliminar venta #${sale.saleNumber}`}
                                  title="Eliminar venta"
                                  className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-transparent bg-red-500/10 px-3 text-xs font-bold text-red-500 hover:border-red-500/20 active:scale-95 transition-all"
                                >
                                  <Trash2 size={13} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Detalle expandible de ítems y garantía en la fila siguiente */}
                          {isOpen && (
                            <tr className="bg-black/[0.015] dark:bg-white/[0.015]">
                              <td colSpan={6} className="py-4 px-6">
                                <div className="space-y-3 border-l-2 border-accent pl-4 py-1">
                                  <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                                    Desglose del Ticket #{sale.saleNumber} ({sale.items.length}{" "}
                                    {sale.items.length === 1 ? "referencia" : "referencias"} · {totalUnits} unidades)
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
                                          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 space-y-2 shadow-xs"
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
                                              className={`rounded-md px-2 py-0.5 font-bold ${
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
                                                onClick={() => toggleItemWarranty(sale.id, item.id)}
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
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`hist-skeleton-${idx}`}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-pulse space-y-3 h-28"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-black/5 dark:bg-white/10" />
                    <div className="h-4 w-20 rounded-full bg-black/5 dark:bg-white/10" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <div className="h-6 w-28 rounded-lg bg-black/5 dark:bg-white/10" />
                    <div className="h-4 w-24 rounded bg-black/5 dark:bg-white/10" />
                  </div>
                </div>
              ))
            ) : filteredSales.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 sm:p-10 text-center shadow-sm select-none animate-in fade-in duration-150">
                <LottiePlayer
                  animationData={EMPTY_BOX_ANIMATION}
                  className="w-32 h-32 mx-auto mb-2"
                  loop={true}
                />
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {query ? "Sin coincidencias de venta" : "Historial vacío"}
                </h4>
                <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-sm mx-auto">
                  {query
                    ? "No se encontraron ventas asociadas al cliente o número consultado."
                    : "Aún no se han completado transacciones comerciales en este ciclo."}
                </p>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all duration-200"
                  >
                    Restablecer búsqueda
                  </button>
                )}
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isOpen = openSaleId === sale.id;

                return (
                  <article
                    key={sale.id}
                    onClick={() => setOpenSaleId(isOpen ? null : sale.id)}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 shadow-sm transition-colors duration-200 cursor-pointer select-none active:scale-[0.99] hover:border-accent/40"
                  >
                    {/* Fila principal: Número de venta + Cliente | Total + Acciones rápidas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="line-clamp-1 text-[15px] font-bold text-[var(--text-primary)]">
                          #{sale.saleNumber} · {sale.customerName}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                          {formatShortDate(sale.createdAt)}{" "}
                          · {sale.paymentMethod}
                          {sale.items.length > 0 && ` · ${sale.items.reduce((s, it) => s + it.qty, 0)} uds`}
                        </p>
                        {sale.note && (
                          <p className="mt-1 line-clamp-1 text-[11px] italic text-[var(--text-secondary)]">
                            Nota: {sale.note}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right pl-2 flex flex-col items-end gap-1.5">
                        <span className="tabular-nums whitespace-nowrap text-sm sm:text-base md:text-lg font-extrabold text-[var(--text-primary)]">
                          {formatCOP(sale.totalAmount)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => openEditModal(sale, e)}
                            aria-label={`Modificar venta #${sale.saleNumber}`}
                            title="Modificar venta"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-accent-subtle px-2 text-[11px] font-bold text-accent hover:border-accent-subtle active:scale-95 transition-all duration-200"
                          >
                            <Pencil size={12} />
                            <span>Modificar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDeleteModal(sale, e)}
                            aria-label={`Eliminar venta #${sale.saleNumber}`}
                            title="Eliminar venta"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-red-500/10 px-2 text-[11px] font-bold text-red-500 hover:border-red-500/20 active:scale-95 transition-all duration-200"
                          >
                            <Trash2 size={12} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detalle desplegable de productos y garantías */}
                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2.5 animate-in fade-in duration-150">
                        {sale.items.map((item) => {
                          const w = getWarrantyStatus(
                            sale.createdAt,
                            item.warrantyDays,
                            item.warrantyClaimed
                          );

                          return (
                            <div
                              key={item.id}
                              className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3 border border-[var(--border-color)] space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                                    {item.qty}x {item.productName}
                                  </p>
                                  <p className="tabular-nums text-[11px] text-[var(--text-secondary)] mt-0.5">
                                    {formatCOP(item.unitPrice)} c/u
                                  </p>
                                </div>
                                <span className="tabular-nums text-xs font-bold text-[var(--text-primary)] shrink-0">
                                  {formatCOP(item.unitPrice * item.qty)}
                                </span>
                              </div>

                              {/* Badge de garantía interactivo */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[var(--border-color)]/60 text-[11px]">
                                <span
                                  className={`rounded-full px-2 py-0.5 font-bold ${
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItemWarranty(sale.id, item.id);
                                    }}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold active:scale-95 transition-transform ${
                                      item.warrantyClaimed
                                        ? "bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        : "bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30]/25"
                                    }`}
                                  >
                                    {item.warrantyClaimed ? "Revertir reclamo" : "Marcar reclamo"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>

      {/* Modal Obligatorio de Confirmación para ELIMINAR Venta */}
      {saleToDelete && (
        <ModalSheet
          title={`Eliminar Venta #${saleToDelete.saleNumber}`}
          onClose={closeDeleteModal}
          onStartClose={() => onModalStateChange?.(false)}
          footer={
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-primary)] active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#ff3b30] text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
              >
                <Trash2 size={16} />
                <span>Sí, eliminar</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-2xl border border-[#ff3b30]/30 bg-[#ff3b30]/10 p-3.5 text-[#ff3b30]">
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

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 p-3.5 cursor-pointer transition-colors">
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
        </ModalSheet>
      )}

      {/* Modal para MODIFICAR Venta con Paso de Confirmación Obligatorio */}
      {editingSale && (
        <ModalSheet
          title={
            confirmSaveEdit
              ? `Confirmar Cambios #${editingSale.saleNumber}`
              : `Modificar Venta #${editingSale.saleNumber}`
          }
          onClose={closeEditModal}
          onStartClose={() => onModalStateChange?.(false)}
          footer={
            confirmSaveEdit ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmSaveEdit(false)}
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-primary)] active:scale-[0.98] transition-transform"
                >
                  Volver a editar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveEdit}
                  className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#30d158] text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
                >
                  <Check size={16} />
                  <span>Confirmar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSaveEdit(true)}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-200"
              >
                Revisar y guardar · {formatCOP(effectiveEditTotal)}
              </button>
            )
          }
        >
          {confirmSaveEdit ? (
            <div className="space-y-4 py-2 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-accent/30 bg-accent-subtle p-4 space-y-2">
                <p className="text-sm font-bold text-accent">
                  ¿Confirmas la actualización de la venta #{editingSale.saleNumber}?
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Los totales financieros y las diferencias de stock en inventario se ajustarán de forma inmediata.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/70 p-3.5 space-y-2 text-xs transition-colors">
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
                  className="mt-1.5 w-full rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors duration-200"
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
                    className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800/80 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 p-3 space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[var(--text-primary)] flex-1 min-w-0 line-clamp-2">
                        {item.productName}
                      </p>
                      <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shrink-0">
                        <button
                          type="button"
                          onClick={() => updateEditItemQty(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent"
                        >
                          −
                        </button>
                        <span className="tabular-nums min-w-6 text-center text-xs font-extrabold text-[var(--text-primary)]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateEditItemQty(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-accent"
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
                          className="tabular-nums mt-0.5 w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-accent transition-colors duration-200"
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
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const active = editPaymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setEditPaymentMethod(method)}
                        className={`min-h-10 rounded-xl border text-xs font-bold transition-all duration-200 ${
                          active
                            ? "border-accent bg-accent text-white shadow-sm"
                            : "border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total cobrado y Nota */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Total cobrado
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCOP(effectiveEditTotal)}
                    onChange={(e) => setEditTotalInput(String(parseCOPInput(e.target.value)))}
                    className="tabular-nums mt-1.5 w-full rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-4 py-2.5 text-base font-extrabold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-accent transition-colors duration-200"
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
                    placeholder="Observación o ajuste de la venta..."
                    className="mt-1.5 w-full rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          )}
        </ModalSheet>
      )}
    </div>
  );
}
