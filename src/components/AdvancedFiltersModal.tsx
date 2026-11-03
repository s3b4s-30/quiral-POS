import { Check, Filter, RotateCcw, SlidersHorizontal, Tag, Truck, Shield, DollarSign, Layers } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { formatCOP, parseCOPInput } from "../utils/formatters";
import ModalSheet from "./ModalSheet";

export type StockStatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export type InventoryPageSize = 10 | 20 | 50 | 100 | "all";

export interface PageSizeOption {
  label: string;
  value: InventoryPageSize;
}

export const PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Todos", value: "all" },
];

export interface AdvancedFilterValues {
  supplierId: string;
  stockStatus: StockStatusFilter;
  minPrice: string;
  maxPrice: string;
  minWarranty: string;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterValues = {
  supplierId: "",
  stockStatus: "all",
  minPrice: "",
  maxPrice: "",
  minWarranty: "",
};

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartClose?: () => void;
  filters: AdvancedFilterValues;
  onApply: (filters: AdvancedFilterValues) => void;
  onReset: () => void;
  pageSize?: InventoryPageSize;
  onPageSizeChange?: (size: InventoryPageSize) => void;
}

const STOCK_STATUS_OPTIONS: Array<{ id: StockStatusFilter; label: string; desc: string }> = [
  { id: "all", label: "Todos", desc: "Sin filtro de existencias" },
  { id: "in_stock", label: "Con stock", desc: "Más de 0 unidades" },
  { id: "low_stock", label: "Stock crítico", desc: "3 o menos unidades" },
  { id: "out_of_stock", label: "Agotados", desc: "0 unidades" },
];

const WARRANTY_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "15", label: "15+ días" },
  { value: "30", label: "30+ días" },
  { value: "90", label: "90+ días" },
];

export default function AdvancedFiltersModal({
  isOpen,
  onClose,
  onStartClose,
  filters,
  onApply,
  onReset,
  pageSize = 10,
  onPageSizeChange,
}: AdvancedFiltersModalProps) {
  const { suppliers, products } = useInventory();

  const [selectedPageSize, setSelectedPageSize] = useState<InventoryPageSize>(pageSize);
  const [supplierId, setSupplierId] = useState(filters.supplierId);
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>(filters.stockStatus);
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [minWarranty, setMinWarranty] = useState(filters.minWarranty);

  const matchingCount = useMemo(() => {
    const minP = parseCOPInput(minPrice);
    const maxP = parseCOPInput(maxPrice);
    const minW = parseInt(minWarranty, 10) || 0;

    return products.filter((p) => {
      const totalStock = p.batches.reduce((sum, b) => sum + b.stock, 0);

      if (supplierId) {
        const hasSupplier = p.batches.some((b) => b.supplierId === supplierId);
        if (!hasSupplier) return false;
      }

      if (stockStatus === "in_stock" && totalStock <= 0) return false;
      if (stockStatus === "low_stock" && (totalStock <= 0 || totalStock > 3)) return false;
      if (stockStatus === "out_of_stock" && totalStock > 0) return false;

      if (minP > 0 && p.price < minP) return false;
      if (maxP > 0 && p.price > maxP) return false;

      if (minW > 0 && p.warrantyDays < minW) return false;

      return true;
    }).length;
  }, [products, supplierId, stockStatus, minPrice, maxPrice, minWarranty]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onPageSizeChange?.(selectedPageSize);
    onApply({
      supplierId,
      stockStatus,
      minPrice,
      maxPrice,
      minWarranty,
    });
    onClose();
  };

  const handleReset = () => {
    setSupplierId("");
    setStockStatus("all");
    setMinPrice("");
    setMaxPrice("");
    setMinWarranty("");
    setSelectedPageSize(10);
    onPageSizeChange?.(10);
    onReset();
    onClose();
  };

  return (
    <ModalSheet
      onClose={onClose}
      onStartClose={onStartClose}
      title="Filtros avanzados"
      footer={
        <div className="flex gap-2.5 w-full">
          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
          >
            <RotateCcw size={16} />
            <span>Limpiar filtros</span>
          </button>
          <button
            type="submit"
            form="advanced-filters-form"
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent text-sm font-bold text-white shadow-md active:scale-95 transition-all hover:bg-accent-hover"
          >
            <Check size={16} />
            <span>Aplicar ({matchingCount} resultados)</span>
          </button>
        </div>
      }
    >
      <form id="advanced-filters-form" onSubmit={handleApply} className="space-y-5">
        {/* 0. Límite de Productos por Vista (Paginación Móvil) */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <Layers size={14} className="text-accent" />
              <span>Productos por vista</span>
            </label>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums">
              {selectedPageSize === "all" ? "Todos los productos" : `Bloques de ${selectedPageSize}`}
            </span>
          </div>
          <div
            role="group"
            aria-label="Cantidad de productos por vista"
            data-testid="page-size-selector"
            className="grid grid-cols-5 gap-1.5"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => {
              const isSelected = selectedPageSize === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  data-testid={`page-size-opt-${opt.value}`}
                  aria-label={`Mostrar ${opt.label} productos`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedPageSize(opt.value);
                    onPageSizeChange?.(opt.value);
                  }}
                  className={`rounded-xl py-2 text-xs font-bold tabular-nums transition-all ${
                    isSelected
                      ? "bg-accent text-white shadow-sm ring-1 ring-accent"
                      : "border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            Configuración de carga progresiva para dispositivos móviles. Valor inicial recomendado: 10 productos.
          </p>
        </div>

        {/* 1. Proveedor */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <Truck size={14} />
            <span>Proveedor</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSupplierId("")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                !supplierId
                  ? "bg-accent text-white shadow-sm"
                  : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Todos los proveedores
            </button>
            {suppliers.map((sup) => {
              const isSelected = supplierId === sup.id;
              return (
                <button
                  key={sup.id}
                  type="button"
                  onClick={() => setSupplierId(sup.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-accent text-white shadow-sm"
                      : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: sup.color }}
                  />
                  <span>{sup.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Estado de Stock */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <Tag size={14} />
            <span>Estado de existencias</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STOCK_STATUS_OPTIONS.map((opt) => {
              const isSelected = stockStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStockStatus(opt.id)}
                  className={`rounded-2xl border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent-subtle text-[var(--text-primary)] ring-1 ring-accent"
                      : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--text-primary)]">{opt.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Rango de Precios */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <DollarSign size={14} />
            <span>Rango de precios de venta</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="mb-1 text-[11px] text-[var(--text-secondary)]">Precio mínimo</p>
              <input
                type="text"
                value={minPrice}
                onChange={(e) => {
                  const num = parseCOPInput(e.target.value);
                  setMinPrice(num > 0 ? formatCOP(num) : "");
                }}
                placeholder="$0"
                className="tabular-nums w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] text-[var(--text-secondary)]">Precio máximo</p>
              <input
                type="text"
                value={maxPrice}
                onChange={(e) => {
                  const num = parseCOPInput(e.target.value);
                  setMaxPrice(num > 0 ? formatCOP(num) : "");
                }}
                placeholder="Sin límite"
                className="tabular-nums w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 4. Garantía Mínima */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <Shield size={14} />
            <span>Garantía</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {WARRANTY_OPTIONS.map((w) => {
              const isSelected = minWarranty === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setMinWarranty(w.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-accent text-white shadow-sm"
                      : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </ModalSheet>
  );
}
