import { Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Closure, ClosureTopSellerTx, Product, Sale } from "../../../types/domain";
import { formatCOP, formatShortDate } from "../../../utils/formatters";
import { useInventory } from "../../../context/InventoryContext";
import ModalSheet from "../../../components/ModalSheet";

interface CycleClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartClose?: () => void;
  sales: Sale[];
  products: Product[];
  showCosts?: boolean;
  onConfirmClose: (closureData: Omit<Closure, "id" | "closedAt">) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export default function CycleClosingModal({
  isOpen,
  onClose,
  onStartClose,
  sales,
  products,
  showCosts = false,
  onConfirmClose,
}: CycleClosingModalProps) {
  const { loading } = useInventory();
  // Rango de fechas por defecto: 14 días atrás hasta hoy
  const [startDate, setStartDate] = useState<Date>(() => new Date(Date.now() - 14 * 864e5));
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [withTime, setWithTime] = useState(false);

  // Selector interactivo de calendario (para "start" o "end")
  const [activeDateField, setActiveDateField] = useState<"start" | "end" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  // Arqueo de caja y notas
  const [rawCash, setRawCash] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Helper para costo de producto
  const getProductAvgCost = useMemo(() => {
    const costMap = new Map<string, number>();
    for (const p of products) {
      const totalStock = p.batches.reduce((sum, b) => sum + b.stock, 0);
      const totalCost = p.batches.reduce((sum, b) => sum + b.cost * b.stock, 0);
      costMap.set(p.id, totalStock > 0 ? Math.round(totalCost / totalStock) : p.batches[0]?.cost || 0);
    }
    return (productId: string) => costMap.get(productId) || 0;
  }, [products]);

  // Cálculo en tiempo real del rango pre-cierre
  const rangeStats = useMemo(() => {
    const a = new Date(startDate);
    const b = new Date(endDate);

    if (!withTime) {
      a.setHours(0, 0, 0, 0);
      b.setHours(23, 59, 59, 999);
    }

    const inRange = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= a && d <= b;
    });

    const sold = inRange.reduce((acc, s) => acc + s.totalAmount, 0);
    const cost = inRange.reduce((acc, s) => {
      const saleCost = s.items.reduce((sAcc, item) => {
        const itemCost = item.unitCostSnapshot ?? getProductAvgCost(item.productId);
        return sAcc + item.qty * itemCost;
      }, 0);
      return acc + saleCost;
    }, 0);

    // Top Sellers
    const sellerMap: Record<string, { id: string; name: string; qty: number; revenue: number; profit: number; tx: ClosureTopSellerTx[] }> = {};
    inRange.forEach((s) => {
      s.items.forEach((item) => {
        const itemCost = item.unitCostSnapshot ?? getProductAvgCost(item.productId);
        const r = (sellerMap[item.productId] ||= {
          id: item.productId,
          name: item.productName,
          qty: 0,
          revenue: 0,
          profit: 0,
          tx: [],
        });
        r.qty += item.qty;
        r.revenue += item.qty * item.unitPrice;
        r.profit += item.qty * (item.unitPrice - itemCost);
        r.tx.push({
          id: `${s.id}-${item.id}`,
          date: s.createdAt,
          customer: s.customerName,
          qty: item.qty,
          price: item.unitPrice,
        });
      });
    });
    const topSellers = Object.values(sellerMap).sort((x, y) => y.qty - x.qty);

    // Top Returned
    const returnMap: Record<string, { id: string; name: string; qty: number; notes: string[] }> = {};
    inRange.forEach((s) => {
      s.items
        .filter((i) => i.warrantyClaimed)
        .forEach((item) => {
          const r = (returnMap[item.productId] ||= {
            id: item.productId,
            name: item.productName,
            qty: 0,
            notes: [],
          });
          r.qty += item.qty;
          if (item.warrantyClaimNote) {
            r.notes.push(item.warrantyClaimNote);
          }
        });
    });
    const topReturned = Object.values(returnMap).sort((x, y) => y.qty - x.qty);

    return {
      sold,
      cost,
      profit: sold - cost,
      topSellers,
      topReturned,
    };
  }, [startDate, endDate, withTime, sales, getProductAvgCost]);

  // Manejador del formato en vivo de efectivo
  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setRawCash(digitsOnly);
  };

  const parsedCash = rawCash ? Number(rawCash) : rangeStats.sold;

  // Calendario: navegación y grilla
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const currentPickingDate = activeDateField === "start" ? startDate : endDate;

  const handleDaySelect = (day: number) => {
    const updated = new Date(currentPickingDate);
    updated.setFullYear(calendarMonth.getFullYear());
    updated.setMonth(calendarMonth.getMonth());
    updated.setDate(day);

    if (activeDateField === "start") {
      setStartDate(updated);
    } else {
      setEndDate(updated);
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const updated = new Date(currentPickingDate);
    updated.setHours(hours);
    updated.setMinutes(minutes);
    if (activeDateField === "start") {
      setStartDate(updated);
    } else {
      setEndDate(updated);
    }
  };

  const handleResetDate = () => {
    if (activeDateField === "start") {
      setStartDate(new Date(Date.now() - 14 * 864e5));
    } else {
      setEndDate(new Date());
    }
  };

  // Construcción de la grilla de días
  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();

  const handleConfirm = () => {
    const periodLabel = `${formatShortDate(startDate)} – ${formatShortDate(endDate)} ${endDate.getFullYear()}`;

    onConfirmClose({
      periodLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSold: rangeStats.sold,
      netProfit: rangeStats.profit,
      recoveredInvestment: rangeStats.cost,
      expectedCash: rangeStats.sold,
      realCashReported: parsedCash,
      differenceNote: note.trim() || undefined,
      topSellers: rangeStats.topSellers,
      topReturned: rangeStats.topReturned,
    });

    onClose();
  };

  if (!isOpen) return null;

  const formatDateDisplay = (date: Date) => {
    const base = date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (!withTime) return base;
    const timeStr = date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${base} ${timeStr}`;
  };

  return (
    <ModalSheet
      title="Cierre de Ciclo"
      onClose={onClose}
      onStartClose={onStartClose}

      contentClassName="p-4 space-y-4"
      footer={
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-2xl bg-accent hover:bg-accent-hover py-3.5 text-base font-semibold text-white shadow-md active:scale-[0.99] transition-all duration-200 select-none"
        >
          Confirmar Cierre de Ciclo
        </button>
      }
    >
      {/* 1. Selector Desde / Hasta */}
      <section>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 block">
              Desde
            </label>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(startDate));
                setActiveDateField(activeDateField === "start" ? null : "start");
              }}
              className={`w-full rounded-2xl border p-3 text-left transition-colors duration-200 select-none ${
                activeDateField === "start"
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              }`}
            >
              <span className="text-sm font-semibold tabular-nums">
                {formatDateDisplay(startDate)}
              </span>
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 block">
              Hasta
            </label>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(endDate));
                setActiveDateField(activeDateField === "end" ? null : "end");
              }}
              className={`w-full rounded-2xl border p-3 text-left transition-colors duration-200 select-none ${
                activeDateField === "end"
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              }`}
            >
              <span className="text-sm font-semibold tabular-nums">
                {formatDateDisplay(endDate)}
              </span>
            </button>
          </div>
        </div>

        {/* Selector de Calendario y Hora Desplegable Estilo iOS */}
        {activeDateField && (
          <div className="mt-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
            {/* Navegación de mes */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-primary)] active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-primary)] active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_LABELS.map((d) => (
                <span key={d} className="text-[11px] font-bold text-[var(--text-secondary)]">
                  {d}
                </span>
              ))}
            </div>

            {/* Grilla de días */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  currentPickingDate.getDate() === dayNum &&
                  currentPickingDate.getMonth() === calendarMonth.getMonth() &&
                  currentPickingDate.getFullYear() === calendarMonth.getFullYear();

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleDaySelect(dayNum)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-semibold transition-transform active:scale-90 ${
                      isSelected
                        ? "bg-accent text-white font-bold shadow-sm"
                        : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Selector de Hora si withTime está activo */}
            {withTime && (
              <div className="mt-3.5 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Clock size={14} /> Hora:
                </span>
                <input
                  type="time"
                  value={`${String(currentPickingDate.getHours()).padStart(2, "0")}:${String(
                    currentPickingDate.getMinutes()
                  ).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                      handleTimeChange(h, m);
                    }
                  }}
                  className="rounded-xl bg-black/5 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none"
                />
              </div>
            )}

            {/* Botones de Confirmación / Reset */}
            <div className="mt-3.5 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetDate}
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setActiveDateField(null)}
                aria-label="Confirmar fecha"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm active:scale-95 transition-colors duration-200"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 2. Switch Toggle: Incluir hora exacta */}
      <div className="flex items-center justify-between py-1 select-none">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Incluir hora exacta
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={withTime}
          onClick={() => setWithTime((prev) => !prev)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 active:scale-95 ${
            withTime ? "bg-accent" : "bg-neutral-300 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
              withTime ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* 3. Resumen Pre-Cierre (Total Vendido y Utilidad Neta) */}
      <div className="grid grid-cols-2 gap-3 select-none">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 sm:p-4 shadow-sm min-w-0">
          <span className="text-xs font-medium text-[var(--text-secondary)] block">
            Total Vendido
          </span>
          <p className="tabular-nums text-base min-[380px]:text-lg sm:text-xl font-extrabold text-[var(--text-primary)] tracking-tight truncate mt-1">
            {loading ? "..." : formatCOP(rangeStats.sold)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 sm:p-4 shadow-sm min-w-0">
          <span className="text-xs font-medium text-[var(--text-secondary)] block">
            Utilidad Neta
          </span>
          <p className="tabular-nums text-base min-[380px]:text-lg sm:text-xl font-extrabold text-[#30d158] tracking-tight truncate mt-1">
            {!showCosts ? "••••••" : loading ? "..." : `+${formatCOP(rangeStats.profit)}`}
          </p>
        </div>
      </div>

      {/* 4. Inputs de Arqueo */}
      <section className="space-y-3">
        <div>
          <label className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 block">
            Efectivo real en caja
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={rawCash ? formatCOP(Number(rawCash)) : ""}
            onChange={handleCashChange}
            placeholder={formatCOP(rangeStats.sold)}
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 py-3 text-base font-bold text-[var(--text-primary)] outline-none focus:border-accent tabular-nums shadow-sm transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase mb-1.5 block">
            Nota de cierre / descuadre
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional..."
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-accent shadow-sm transition-colors"
          />
        </div>
      </section>
    </ModalSheet>
  );
}
