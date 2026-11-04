import {
  Check,
  Copy,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { Product, ProductCategory, Supplier } from "../../../types/domain";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";

export type EditableColKey = "stock" | "cost" | "price";

export interface EnrichedRow {
  product: Product;
  originalIndex: number;
  totalStock: number;
  avgCost: number;
  profit: number;
  marginPct: number;
  attributeBadges: string[];
}

/**
 * Manejadores estables (referencia constante durante toda la vida del grid) que las
 * filas y celdas memorizadas reciben por props. Al no cambiar de identidad, nunca
 * invalidan `React.memo`.
 */
export interface GridHandlers {
  focusCell: (rowIndex: number, colKey: EditableColKey) => void;
  startEditing: (rowIndex: number, colKey: EditableColKey) => void;
  commitEdit: (
    rowIndex: number,
    colKey: EditableColKey,
    rawValue: string
  ) => void;
  cellKeyDown: (
    e: React.KeyboardEvent,
    rowIndex: number,
    colKey: EditableColKey
  ) => void;
  setDraft: (value: string) => void;
  registerCell: (key: string, el: HTMLDivElement | null) => void;
  registerActiveInput: (el: HTMLInputElement | null) => void;
  toggleRowSelect: (productId: string) => void;
  adjustStock: (productId: string, delta: number) => void;
  addToCart: (productId: string) => void;
  inspect: (product: Product) => void;
  duplicate: (product: Product) => void;
  remove: (product: Product) => void;
}

/* -------------------------------------------------------------------------- */
/*                     Celda editable memorizada (Excel-like)                  */
/* -------------------------------------------------------------------------- */

interface EditableGridCellProps {
  rowIndex: number;
  rowId: string;
  colKey: EditableColKey;
  productName: string;
  value: number;
  isFocused: boolean;
  isEditing: boolean;
  draftValue: string;
  handlers: GridHandlers;
}

const CELL_LABELS: Record<EditableColKey, string> = {
  stock: "Stock",
  cost: "Costo",
  price: "Precio sugerido",
};

function stockBadgeClasses(totalStock: number): string {
  if (totalStock > 5)
    return "bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30";
  if (totalStock > 0)
    return "bg-[#ff9500]/15 text-[#ff9500] border-[#ff9500]/30";
  return "bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/30";
}

export const EditableGridCell = memo(
  function EditableGridCell({
    rowIndex,
    rowId,
    colKey,
    productName,
    value,
    isFocused,
    isEditing,
    draftValue,
    handlers,
  }: EditableGridCellProps) {
    const isStock = colKey === "stock";
    const align = isStock ? "justify-between px-2" : "justify-end px-3";

    return (
      <div
        ref={(el) => handlers.registerCell(`${rowIndex}:${colKey}`, el)}
        tabIndex={0}
        role="gridcell"
        aria-label={`${CELL_LABELS[colKey]} de ${productName}`}
        data-testid={`grid-cell-${colKey}-${rowIndex}`}
        onClick={() => {
          if (!isFocused) handlers.focusCell(rowIndex, colKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handlers.startEditing(rowIndex, colKey);
        }}
        onKeyDown={(e) => handlers.cellKeyDown(e, rowIndex, colKey)}
        className={`flex h-full min-h-[42px] items-center ${align} py-1.5 outline-none cursor-pointer select-none transition-all duration-150 ${
          isFocused ? "ring-2 ring-inset ring-accent bg-accent-subtle" : ""
        }`}
      >
        {isFocused && isEditing ? (
          <input
            ref={handlers.registerActiveInput}
            data-testid={`grid-input-${colKey}-${rowIndex}`}
            type="text"
            inputMode="numeric"
            value={draftValue}
            onChange={(e) => handlers.setDraft(e.target.value)}
            onBlur={(e) =>
              handlers.commitEdit(rowIndex, colKey, e.currentTarget.value)
            }
            onKeyDown={(e) => handlers.cellKeyDown(e, rowIndex, colKey)}
            className={`tabular-nums w-full rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 ${
              isStock ? "text-center" : "text-right"
            } text-xs font-extrabold text-[var(--text-primary)] outline-none ring-1 ring-accent`}
          />
        ) : isStock ? (
          <>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handlers.adjustStock(rowId, -1);
              }}
              disabled={value <= 0}
              aria-label={`Disminuir stock de ${productName}`}
              className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity duration-150"
            >
              <Minus size={11} />
            </button>

            <span
              className={`tabular-nums inline-flex min-w-[44px] items-center justify-center rounded-md border px-2 py-0.5 text-xs sm:text-sm font-black ${stockBadgeClasses(
                value
              )}`}
            >
              {value}
            </span>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handlers.adjustStock(rowId, 1);
              }}
              aria-label={`Aumentar stock de ${productName}`}
              className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              <Plus size={11} />
            </button>
          </>
        ) : colKey === "cost" ? (
          <span className="tabular-nums font-bold text-xs sm:text-sm text-[var(--text-secondary)]">
            {formatCOP(value)}
          </span>
        ) : (
          <span className="tabular-nums text-sm font-black text-[var(--text-primary)]">
            {formatCOP(value)}
          </span>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.rowIndex === next.rowIndex &&
    prev.rowId === next.rowId &&
    prev.colKey === next.colKey &&
    prev.productName === next.productName &&
    prev.value === next.value &&
    prev.isFocused === next.isFocused &&
    prev.isEditing === next.isEditing &&
    prev.draftValue === next.draftValue &&
    prev.handlers === next.handlers
);

/* -------------------------------------------------------------------------- */
/*                          Fila de producto memorizada                        */
/* -------------------------------------------------------------------------- */

export interface InventoryGridRowProps {
  row: EnrichedRow;
  rowIndex: number;
  isSelected: boolean;
  /** Columna activa SOLO si la celda activa pertenece a esta fila; `null` en caso contrario. */
  activeColKey: EditableColKey | null;
  /** `true` solo si esta fila contiene la celda en edición. */
  isEditing: boolean;
  /** Borrador de edición (cadena vacía si esta fila no está en edición). */
  draftValue: string;
  showCosts: boolean;
  isAddedToCart: boolean;
  supplierMap: Map<string, Supplier>;
  handlers: GridHandlers;
  /** Medición dinámica de altura (solo en modo virtualizado). */
  measureRef?: (el: HTMLTableRowElement | null) => void;
}

export const InventoryGridRow = memo(
  function InventoryGridRow({
    row,
    rowIndex,
    isSelected,
    activeColKey,
    isEditing,
    draftValue,
    showCosts,
    isAddedToCart,
    supplierMap,
    handlers,
    measureRef,
  }: InventoryGridRowProps) {
    const {
      product,
      originalIndex,
      totalStock,
      avgCost,
      profit,
      marginPct,
      attributeBadges,
    } = row;

    return (
      <tr
        ref={measureRef}
        data-index={rowIndex}
        data-testid={`desktop-grid-row-${rowIndex}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handlers.inspect(product);
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('input, button, a, [contenteditable="true"]'))
            return;
          handlers.toggleRowSelect(product.id);
        }}
        className={`group transition-colors duration-150 cursor-pointer ${
          isSelected
            ? "bg-accent-subtle/60"
            : "hover:bg-black/[0.035] dark:hover:bg-white/[0.045]"
        }`}
      >
        {/* 1. [✓] / Nº (48px) */}
        <td className="w-12 border-r border-[var(--border-color)] px-2 py-2 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <input
              type="checkbox"
              data-testid={`grid-row-checkbox-${rowIndex}`}
              checked={isSelected}
              onChange={() => handlers.toggleRowSelect(product.id)}
              aria-label={`Seleccionar ${product.name}`}
              className={`h-3.5 w-3.5 rounded accent-[var(--accent-primary)] cursor-pointer transition-opacity duration-150 ${
                isSelected
                  ? "opacity-100"
                  : "opacity-30 group-hover:opacity-100"
              }`}
            />
            <span className="tabular-nums text-xs font-bold text-[var(--text-secondary)]">
              {originalIndex}
            </span>
          </div>
        </td>

        {/* 2. Artículo / Referencia (min-w-[260px]) */}
        <td className="min-w-[260px] border-r border-[var(--border-color)] px-3.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlers.inspect(product);
                }}
                className="text-left font-bold text-sm sm:text-base text-[var(--text-primary)] hover:text-accent transition-colors duration-150 truncate block max-w-full cursor-pointer"
                title="Clic para abrir el panel de inspección y atributos avanzados"
              >
                {product.name}
              </button>

              {attributeBadges.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {attributeBadges.map((badge, bIdx) => (
                    <span
                      key={`${product.id}-attr-${bIdx}`}
                      className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Puntos de color de lotes por proveedor (colores fijos del proveedor) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {product.batches
                .filter((b) => b.stock > 0)
                .map((b) => {
                  const sup = supplierMap.get(b.supplierId);
                  return (
                    <span
                      key={b.id}
                      title={`${sup?.name ?? "Proveedor"}: ${b.stock} uds`}
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                      style={{ backgroundColor: sup?.color ?? "#007aff" }}
                    />
                  );
                })}
            </div>
          </div>
        </td>

        {/* 3. Categoría (160px) */}
        <td className="w-[160px] border-r border-[var(--border-color)] px-3 py-2">
          <span className="inline-flex max-w-full truncate rounded-full border border-accent/30 bg-accent-subtle px-2.5 py-0.5 text-xs font-bold text-accent antialiased-hd">
            {product.category}
          </span>
        </td>

        {/* 4. Stock (120px - Editable Inline) */}
        <td className="w-[120px] border-r border-[var(--border-color)] p-0">
          <EditableGridCell
            rowIndex={rowIndex}
            rowId={product.id}
            colKey="stock"
            productName={product.name}
            value={totalStock}
            isFocused={activeColKey === "stock"}
            isEditing={isEditing && activeColKey === "stock"}
            draftValue={activeColKey === "stock" ? draftValue : ""}
            handlers={handlers}
          />
        </td>

        {/* 5. Costo / Mayor (140px - Editable / Protegido por Privacidad) */}
        <td className="w-[140px] border-r border-[var(--border-color)] p-0">
          {showCosts ? (
            <EditableGridCell
              rowIndex={rowIndex}
              rowId={product.id}
              colKey="cost"
              productName={product.name}
              value={avgCost}
              isFocused={activeColKey === "cost"}
              isEditing={isEditing && activeColKey === "cost"}
              draftValue={activeColKey === "cost" ? draftValue : ""}
              handlers={handlers}
            />
          ) : (
            <div
              data-testid={`grid-cell-cost-${rowIndex}`}
              title="Modo Privacidad Activo: Revela los costos en la barra superior para ver o editar"
              className="flex h-full min-h-[42px] items-center justify-end gap-1 px-3 py-1.5 text-[var(--text-secondary)] opacity-60 select-none cursor-not-allowed"
            >
              <Lock size={11} />
              <span className="tracking-widest font-bold">••••••</span>
            </div>
          )}
        </td>

        {/* 6. Precio Sugerido (150px - Editable Inline) */}
        <td className="w-[150px] border-r border-[var(--border-color)] p-0">
          <EditableGridCell
            rowIndex={rowIndex}
            rowId={product.id}
            colKey="price"
            productName={product.name}
            value={product.price}
            isFocused={activeColKey === "price"}
            isEditing={isEditing && activeColKey === "price"}
            draftValue={activeColKey === "price" ? draftValue : ""}
            handlers={handlers}
          />
        </td>

        {/* 7. Utilidad / Margen (120px - Calculado en vivo) */}
        <td className="w-[120px] border-r border-[var(--border-color)] px-3 py-2 text-right">
          {showCosts ? (
            <div className="flex flex-col items-end leading-tight">
              <span
                className={`tabular-nums font-bold ${
                  profit >= 0 ? "text-[#30d158]" : "text-[#ff3b30]"
                }`}
              >
                {profit >= 0 ? "+" : ""}
                {formatCOP(profit)}
              </span>
              <span className="tabular-nums text-[10px] font-semibold text-[var(--text-secondary)]">
                {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`}
              </span>
            </div>
          ) : (
            <span className="tracking-widest font-bold text-[var(--text-secondary)] opacity-60 select-none">
              ••••••
            </span>
          )}
        </td>

        {/* 8. Acciones Rápidas (110px centrado) */}
        <td className="w-[110px] px-2 py-1.5 text-center">
          <RowActionButtons
            product={product}
            canSell={totalStock > 0}
            isAddedToCart={isAddedToCart}
            handlers={handlers}
          />
        </td>
      </tr>
    );
  },
  (prev, next) =>
    // `row` se recrea en cada cálculo de enrichedRows: comparamos la referencia del
    // producto (inmutable desde el contexto) y los derivados primitivos.
    prev.row.product === next.row.product &&
    prev.row.originalIndex === next.row.originalIndex &&
    prev.rowIndex === next.rowIndex &&
    prev.isSelected === next.isSelected &&
    prev.activeColKey === next.activeColKey &&
    prev.isEditing === next.isEditing &&
    prev.draftValue === next.draftValue &&
    prev.showCosts === next.showCosts &&
    prev.isAddedToCart === next.isAddedToCart &&
    prev.supplierMap === next.supplierMap &&
    prev.handlers === next.handlers &&
    prev.measureRef === next.measureRef
);

/* -------------------------------------------------------------------------- */
/*                       Botones de acción por fila (memo)                     */
/* -------------------------------------------------------------------------- */

interface RowActionButtonsProps {
  product: Product;
  canSell: boolean;
  isAddedToCart: boolean;
  handlers: GridHandlers;
}

const RowActionButtons = memo(function RowActionButtons({
  product,
  canSell,
  isAddedToCart,
  handlers,
}: RowActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlers.addToCart(product.id);
        }}
        disabled={!canSell}
        title="Agregar al carrito de venta"
        aria-label={`Agregar ${product.name} al carrito`}
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-150 ${
          isAddedToCart
            ? "border-[#30d158] bg-[#30d158] text-white"
            : "border-transparent hover:border-accent/40 hover:bg-accent-subtle text-[var(--text-secondary)] hover:text-accent disabled:opacity-30"
        }`}
      >
        {isAddedToCart ? <Check size={13} /> : <ShoppingCart size={13} />}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlers.inspect(product);
        }}
        title="Inspeccionar y editar todos los atributos (Espacio)"
        aria-label={`Editar detalles de ${product.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-accent/40 hover:bg-accent-subtle text-[var(--text-secondary)] hover:text-accent transition-all duration-150"
      >
        <SlidersHorizontal size={13} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlers.duplicate(product);
        }}
        title="Duplicar referencia"
        aria-label={`Duplicar ${product.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
      >
        <Copy size={13} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlers.remove(product);
        }}
        title="Eliminar referencia"
        aria-label={`Eliminar ${product.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all duration-150"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*            Fila de Inserción Rápida con estado local aislado (memo)         */
/* -------------------------------------------------------------------------- */

export interface QuickAddPayload {
  name: string;
  category: ProductCategory;
  stock: number;
  cost: number;
  price: number;
}

interface QuickAddRowProps {
  categoryOrder: ProductCategory[];
  showCosts: boolean;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onSubmit: (payload: QuickAddPayload) => void;
}

/**
 * El estado de los inputs vive DENTRO de esta fila: teclear en la creación rápida
 * ya no re-renderiza el grid completo ni sus cientos de filas.
 */
export const QuickAddRow = memo(function QuickAddRow({
  categoryOrder,
  showCosts,
  inputRef,
  onSubmit,
}: QuickAddRowProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(
    categoryOrder[0] || "Cargadores y Cables"
  );
  const [stock, setStock] = useState("1");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");

  // Mantener una categoría válida si la configuración del catálogo cambia
  useEffect(() => {
    if (categoryOrder.length > 0 && !categoryOrder.includes(category)) {
      setCategory(categoryOrder[0]);
    }
  }, [categoryOrder, category]);

  const parsedPrice = parseCOPInput(price);
  const canSubmit = name.trim().length > 0 && parsedPrice > 0;

  const submit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      category,
      stock: Math.max(0, parseInt(stock, 10) || 0),
      cost: parseCOPInput(cost),
      price: parsedPrice,
    });
    // Limpiar campos y mantener foco en Nombre para ingreso en serie
    setName("");
    setStock("1");
    setCost("");
    setPrice("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit(e);
  };

  return (
    <tr
      data-testid="desktop-quick-add-row"
      className="bg-accent-subtle/40 dark:bg-white/[0.02] transition-colors duration-150"
    >
      <td className="border-r border-[var(--border-color)] px-2 py-2 text-center font-extrabold text-accent">
        +
      </td>
      <td className="border-r border-[var(--border-color)] px-2.5 py-1.5">
        <input
          ref={inputRef}
          data-testid="quick-add-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="+ Creación rápida en línea (Nombre / Referencia)... [Ctrl+N]"
          className="w-full rounded-lg border border-transparent focus:border-accent bg-transparent px-2 py-1 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors duration-150"
        />
      </td>
      <td className="border-r border-[var(--border-color)] px-2 py-1.5">
        <select
          data-testid="quick-add-category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          onKeyDown={onKeyDown}
          aria-label="Categoría para creación rápida"
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-accent"
        >
          {categoryOrder.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </td>
      <td className="border-r border-[var(--border-color)] px-2 py-1.5">
        <input
          data-testid="quick-add-stock-input"
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Stock"
          aria-label="Stock inicial para creación rápida"
          className="tabular-nums w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-center text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
        />
      </td>
      <td className="border-r border-[var(--border-color)] px-2 py-1.5">
        <input
          data-testid="quick-add-cost-input"
          type="text"
          inputMode="numeric"
          value={cost}
          onChange={(e) => {
            const n = parseCOPInput(e.target.value);
            setCost(n > 0 ? formatCOP(n) : "");
          }}
          onKeyDown={onKeyDown}
          placeholder="$ Costo"
          aria-label="Costo para creación rápida"
          className="tabular-nums w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-right text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-accent"
        />
      </td>
      <td className="border-r border-[var(--border-color)] px-2 py-1.5">
        <input
          data-testid="quick-add-price-input"
          type="text"
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            const n = parseCOPInput(e.target.value);
            setPrice(n > 0 ? formatCOP(n) : "");
          }}
          onKeyDown={onKeyDown}
          placeholder="$ Precio *"
          aria-label="Precio de venta para creación rápida"
          className="tabular-nums w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-right text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
        />
      </td>
      <td className="border-r border-[var(--border-color)] px-2.5 py-1.5 text-right text-[11px] font-semibold text-[var(--text-secondary)]">
        <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px]">
          Enter ↵
        </kbd>
      </td>
      <td className="px-2 py-1.5 text-center">
        <button
          type="button"
          data-testid="quick-add-submit-btn"
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all duration-150"
        >
          <Plus size={13} />
          <span>Crear</span>
        </button>
      </td>
    </tr>
  );
});
