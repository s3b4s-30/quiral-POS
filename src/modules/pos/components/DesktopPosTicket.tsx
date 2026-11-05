import {
  AlertTriangle,
  Check,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useInventory } from "../../../context/InventoryContext";
import { PaymentMethod } from "../../../types/domain";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  icon: typeof DollarSign;
}> = [
  { id: "Efectivo", label: "Efectivo", icon: DollarSign },
  { id: "Nequi", label: "Nequi", icon: CreditCard },
  { id: "Bancolombia", label: "Bancolombia", icon: CreditCard },
  { id: "Tarjeta", label: "Tarjeta", icon: CreditCard },
];

interface DesktopPosTicketProps {
  onSaleCompleteSuccess?: () => void;
}

export default function DesktopPosTicket({
  onSaleCompleteSuccess,
}: DesktopPosTicketProps) {
  const {
    cart,
    cartUnits,
    products,
    suppliers,
    showCosts,
    updateCartQuantity,
    updateCartItemPrice,
    updateCartItemBatch,
    removeFromCart,
    clearCart,
    completeSale,
    sales,
  } = useInventory();

  const [payment, setPayment] = useState<PaymentMethod>("Efectivo");
  const [customTotalInput, setCustomTotalInput] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const submittingRef = useRef(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Número de venta correlativo siguiente (ej: Sale #119)
  const nextSaleNumber = useMemo(() => {
    if (!sales || sales.length === 0) return 1;
    const maxNumber = sales.reduce((max, s) => {
      const num =
        typeof s.saleNumber === "number"
          ? s.saleNumber
          : parseInt(String(s.saleNumber || 0), 10);
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    return maxNumber + 1;
  }, [sales]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [cart]
  );

  const parsedCustom = customTotalInput
    ? parseCOPInput(customTotalInput)
    : null;
  const effectiveTotal =
    parsedCustom !== null ? Math.min(subtotal, parsedCustom) : subtotal;

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const b = p?.batches.find((batch) => batch.id === item.batchId);
      return sum + item.quantity * (b?.cost ?? 0);
    }, 0);
  }, [cart, products]);

  const estimatedProfit = effectiveTotal - totalCost;

  const handleCompleteSale = () => {
    if (!cart.length || submittingRef.current) return;
    submittingRef.current = true;

    const ok = completeSale(
      payment,
      effectiveTotal,
      customerName.trim() || undefined
    );
    if (ok) {
      setCustomTotalInput("");
      setCustomerName("");
      setShowClearConfirm(false);
      setIsSuccessFlash(true);
      setTimeout(() => setIsSuccessFlash(false), 2000);
      onSaleCompleteSuccess?.();
      submittingRef.current = false;
    } else {
      submittingRef.current = false;
    }
  };

  // Atajo global Ctrl+Enter para completar la venta desde cualquier punto de la pantalla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (cart.length > 0 && !submittingRef.current) {
          e.preventDefault();
          handleCompleteSale();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, payment, effectiveTotal, customerName]);

  return (
    <aside
      data-testid="desktop-pos-ticket"
      className="w-80 lg:w-96 xl:w-[400px] 2xl:w-[420px] shrink-0 h-full flex flex-col bg-[var(--bg-elevated)] border-l border-[var(--border-color)] dark:border-white/10 select-none transition-colors duration-150 z-10"
    >
      {/* 1. Header del Ticket: Título, consecutivo, contador de ítems y botón vaciar */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent border border-accent/20">
            <Receipt size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--text-primary)] truncate">
                Ticket de Venta
              </h2>
              <span className="tabular-nums rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                #{nextSaleNumber}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] truncate">
              {cartUnits} {cartUnits === 1 ? "artículo" : "artículos"}{" "}
              seleccionados
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <div>
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                  type="button"
                  data-testid="confirm-clear-cart-btn"
                  onClick={() => {
                    clearCart();
                    setShowClearConfirm(false);
                    setCustomTotalInput("");
                  }}
                  className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
                  title="Confirmar vaciar carrito"
                >
                  Vaciar
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="clear-cart-btn"
                onClick={() => setShowClearConfirm(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-red-500/20 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all duration-150"
                title="Vaciar ticket completo"
                aria-label="Vaciar carrito"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Banner de venta exitosa instantáneo */}
      {isSuccessFlash && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="stroke-[3]" />
            <span>¡Venta registrada con éxito!</span>
          </div>
          <span className="text-[10px] opacity-75">
            Listo para el siguiente cliente
          </span>
        </div>
      )}

      {/* 2. Cuerpo del Ticket: Lista con scroll independiente de productos */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-secondary)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-[var(--border-color)] mb-3 text-[var(--text-secondary)]">
              <ShoppingCart size={28} className="opacity-40" />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Ticket Vacío
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[220px]">
              Haz clic en los productos del catálogo a la izquierda para
              añadirlos a este ticket.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const product = products.find(
              (entry) => entry.id === item.productId
            );
            if (!product) return null;
            const activeBatch = product.batches.find(
              (b) => b.id === item.batchId
            );
            const maxStock = activeBatch?.stock ?? 0;

            return (
              <div
                key={item.productId}
                data-testid={`pos-ticket-item-${item.productId}`}
                className="group relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 space-y-2 transition-all duration-150 hover:border-accent/30"
              >
                {/* Fila Superior: Nombre del producto, precio unitario y botón quitar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-[15px] font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                      {product.name}
                    </p>
                    {product.subtitle && (
                      <p className="text-xs font-medium text-[var(--text-secondary)] truncate mt-0.5">
                        {product.subtitle}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Eliminar ${product.name} del ticket`}
                    onClick={() => removeFromCart(product.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 active:scale-90 transition-all opacity-70 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Fila Intermedia: Controles de Cantidad y Precio Editable */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]/60">
                  {/* Selector rápido - / + */}
                  <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-0.5">
                    <button
                      type="button"
                      aria-label={`Disminuir cantidad de ${product.name}`}
                      onClick={() =>
                        updateCartQuantity(product.id, item.quantity - 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-accent hover:bg-accent-subtle active:scale-90 transition-all"
                    >
                      <Minus size={13} />
                    </button>
                    <span
                      data-testid={`pos-ticket-qty-${item.productId}`}
                      className="tabular-nums min-w-[30px] text-center text-sm font-black text-[var(--text-primary)]"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar cantidad de ${product.name}`}
                      disabled={item.quantity >= maxStock}
                      onClick={() =>
                        updateCartQuantity(product.id, item.quantity + 1)
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-accent hover:bg-accent-subtle active:scale-90 transition-all ${
                        item.quantity >= maxStock
                          ? "opacity-30 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Input de Precio Unitario Editable en vivo */}
                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                      c/u:
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCOP(item.unitPrice)}
                      onChange={(e) =>
                        updateCartItemPrice(
                          product.id,
                          parseCOPInput(e.target.value)
                        )
                      }
                      className="tabular-nums w-24 sm:w-28 text-right rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>

                {/* Subfila Lotes / Proveedor si hay múltiples lotes disponibles (Ergonomía de Mouse: flex-wrap completo) */}
                {product.batches.filter((b) => b.stock > 0).length > 1 && (
                  <div className="pt-1.5 border-t border-[var(--border-color)]/40 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[var(--text-secondary)] shrink-0 font-semibold mr-1">
                      Lote:
                    </span>
                    {product.batches
                      .filter((b) => b.stock > 0)
                      .map((batch) => {
                        const sup = suppliers.find(
                          (s) => s.id === batch.supplierId
                        );
                        const isCurrentBatch = batch.id === item.batchId;
                        const supColor = sup?.color || "#007aff";
                        return (
                          <button
                            key={batch.id}
                            type="button"
                            onClick={() =>
                              updateCartItemBatch(product.id, batch.id)
                            }
                            style={
                              isCurrentBatch
                                ? {
                                    backgroundColor: supColor,
                                    borderColor: supColor,
                                    color: "#ffffff",
                                  }
                                : { borderColor: `${supColor}40` }
                            }
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                              isCurrentBatch
                                ? "shadow-sm"
                                : "border bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: isCurrentBatch
                                  ? "#ffffff"
                                  : supColor,
                              }}
                            />
                            <span>
                              {sup?.name || "Prov"} ({batch.stock} uds)
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Pie del Ticket: Cobro Directo Integrado (Sin Modales) */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] shrink-0 space-y-3.5 shadow-lg shadow-black/5">
        {/* Nombre de cliente / Notas */}
        <div>
          <div className="relative">
            <User
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
            />
            <input
              ref={customerInputRef}
              type="text"
              data-testid="pos-customer-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cliente general / Notas (opcional)..."
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>

        {/* Métodos de Pago en Grilla de 4 */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Método de Pago
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map((m) => {
              const isActive = payment === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`payment-method-${m.id.toLowerCase()}`}
                  onClick={() => setPayment(m.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-95 ${
                    isActive
                      ? "bg-accent text-white shadow-sm shadow-accent/25"
                      : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                  }`}
                >
                  <Icon size={14} className="mb-0.5" />
                  <span className="truncate w-full text-center">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desglose de Totales y Ajuste de Monto */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Subtotal ({cartUnits} uds)</span>
            <span className="tabular-nums font-bold text-[var(--text-primary)]">
              {formatCOP(subtotal)}
            </span>
          </div>

          {showCosts && cart.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-[var(--border-color)]/60">
              <span>Utilidad esperada</span>
              <span className="tabular-nums">
                +{formatCOP(estimatedProfit)}
              </span>
            </div>
          )}

          <div className="pt-1 border-t border-[var(--border-color)]/80 flex items-center justify-between">
            <span className="text-sm font-black text-[var(--text-primary)]">
              Total a Cobrar
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                data-testid="pos-custom-total-input"
                inputMode="numeric"
                value={
                  customTotalInput
                    ? formatCOP(parseCOPInput(customTotalInput))
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  if (!raw) {
                    setCustomTotalInput("");
                  } else {
                    const num = parseInt(raw, 10);
                    setCustomTotalInput(String(Math.min(subtotal, num)));
                  }
                }}
                placeholder={formatCOP(subtotal)}
                aria-label="Ajustar total a cobrar"
                className="tabular-nums w-28 sm:w-32 text-right rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-sm sm:text-base font-black text-[var(--text-primary)] outline-none focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Botón Principal: Completar Venta */}
        <button
          type="button"
          data-testid="complete-sale-desktop-btn"
          disabled={cart.length === 0}
          onClick={handleCompleteSale}
          className={`w-full py-3 px-4 rounded-xl font-black text-sm tracking-wide text-white transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] ${
            cart.length > 0
              ? "bg-accent hover:bg-accent-hover shadow-accent-glow cursor-pointer"
              : "bg-black/10 dark:bg-white/10 text-[var(--text-secondary)] opacity-50 cursor-not-allowed"
          }`}
        >
          <span>Completar Venta</span>
          <span className="tabular-nums font-extrabold">
            · {formatCOP(effectiveTotal)}
          </span>
          <kbd className="hidden lg:inline-flex items-center ml-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-white/80 bg-white/20 rounded border border-white/25">
            Ctrl + ↵
          </kbd>
        </button>
      </div>
    </aside>
  );
}
