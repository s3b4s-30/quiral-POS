import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { Product, ProductCategory } from "../types/domain";
import { formatCOP, parseCOPInput } from "../utils/formatters";

export type EditableColKey = "stock" | "cost" | "price";
type SortColumn = "index" | "name" | "category" | "stock" | "cost" | "price" | "profit";
type SortDirection = "asc" | "desc" | null;

interface ActiveCell {
  rowIndex: number;
  colKey: EditableColKey;
}

interface DesktopInventoryGridProps {
  products: Product[];
  onInspectProduct: (product: Product) => void;
  quickCountMode: boolean;
  focusQuickAddRef?: React.MutableRefObject<(() => void) | null>;
}

export default function DesktopInventoryGrid({
  products,
  onInspectProduct,
  quickCountMode,
  focusQuickAddRef,
}: DesktopInventoryGridProps) {
  const {
    suppliers,
    getSupplier,
    showCosts,
    addToCart,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    adjustMasterStock,
    updateProductPrice,
    catalogConfig,
  } = useInventory();

  // Estado de ordenamiento por columna
  const [sortColumn, setSortColumn] = useState<SortColumn>("index");
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Selección múltiple para acciones en lote (Bulk Actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<ProductCategory>(
    catalogConfig.categoryOrder[0] || "Cargadores y Cables"
  );

  // Coordenadas de Celda Activa y Modo Edición (Keyboard-First Engine)
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [isEditingCell, setIsEditingCell] = useState(false);
  const [editDraftValue, setEditDraftValue] = useState("");

  // Feedback visual al agregar al carrito desde la fila
  const [addedCartId, setAddedCartId] = useState<string | null>(null);

  // Fila de Inserción Rápida (Quick-Add Inline Row)
  const [quickName, setQuickName] = useState("");
  const [quickCategory, setQuickCategory] = useState<ProductCategory>(
    catalogConfig.categoryOrder[0] || "Cargadores y Cables"
  );
  const [quickStock, setQuickStock] = useState("1");
  const [quickCost, setQuickCost] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const quickNameInputRef = useRef<HTMLInputElement | null>(null);

  // Referencias para enfoque programático de celdas e inputs
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  // Exponer disparador para Ctrl + N hacia el campo Nombre de Quick-Add
  useEffect(() => {
    if (focusQuickAddRef) {
      focusQuickAddRef.current = () => {
        quickNameInputRef.current?.focus();
        quickNameInputRef.current?.select();
      };
    }
  }, [focusQuickAddRef]);

  // Columnas editables habilitadas según modo de privacidad (showCosts)
  const editableColumns = useMemo<EditableColKey[]>(
    () => (showCosts ? ["stock", "cost", "price"] : ["stock", "price"]),
    [showCosts]
  );

  // Calcular métricas derivadas por fila y aplicar ordenamiento de columna
  const enrichedRows = useMemo(() => {
    const base = products.map((product, idx) => {
      const totalStock = product.batches.reduce((sum, b) => sum + b.stock, 0);
      const totalBatchCost = product.batches.reduce(
        (sum, b) => sum + b.cost * b.stock,
        0
      );
      const avgCost =
        totalStock > 0
          ? Math.round(totalBatchCost / totalStock)
          : product.batches[0]?.cost ?? 0;
      const profit = product.price - avgCost;
      const marginPct = avgCost > 0 ? Math.round((profit / avgCost) * 100) : 0;

      const attributeBadges = (product.subtitle || "")
        .split("·")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== product.category.toLowerCase());

      return {
        product,
        originalIndex: idx + 1,
        totalStock,
        avgCost,
        profit,
        marginPct,
        attributeBadges,
      };
    });

    if (!sortDirection || sortColumn === "index") {
      return sortDirection === "desc" ? [...base].reverse() : base;
    }

    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = a.product.name.localeCompare(b.product.name, "es");
          break;
        case "category":
          cmp = a.product.category.localeCompare(b.product.category, "es");
          break;
        case "stock":
          cmp = a.totalStock - b.totalStock;
          break;
        case "cost":
          cmp = a.avgCost - b.avgCost;
          break;
        case "price":
          cmp = a.product.price - b.product.price;
          break;
        case "profit":
          cmp = a.profit - b.profit;
          break;
        default:
          cmp = 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [products, sortColumn, sortDirection]);

  // Cuando se activa Modo Conteo Rápido (Alt + M), enfocar automáticamente la celda Stock de la fila 0
  useEffect(() => {
    if (quickCountMode && enrichedRows.length > 0) {
      setActiveCell({ rowIndex: 0, colKey: "stock" });
      setIsEditingCell(false);
    }
  }, [quickCountMode]);

  // Sincronizar el foco del DOM con la celda activa cuando no se está editando
  useEffect(() => {
    if (!activeCell) return;
    if (isEditingCell) {
      requestAnimationFrame(() => {
        activeInputRef.current?.focus();
        activeInputRef.current?.select();
      });
    } else {
      const key = `${activeCell.rowIndex}:${activeCell.colKey}`;
      const el = cellRefs.current.get(key);
      el?.focus({ preventScroll: false });
    }
  }, [activeCell, isEditingCell]);

  // Limpiar selecciones huérfanas si cambian los productos
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(products.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const handleToggleSort = (col: SortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortDirection(null);
    } else {
      setSortDirection("asc");
    }
  };

  // Obtener el valor numérico actual de una celda
  const getCellNumericValue = (rowIndex: number, colKey: EditableColKey): number => {
    const row = enrichedRows[rowIndex];
    if (!row) return 0;
    if (colKey === "stock") return row.totalStock;
    if (colKey === "cost") return row.avgCost;
    return row.product.price;
  };

  // Iniciar edición inline de una celda
  const startEditingCell = (
    rowIndex: number,
    colKey: EditableColKey,
    initialOverride?: string
  ) => {
    if (colKey === "cost" && !showCosts) return;
    const row = enrichedRows[rowIndex];
    if (!row) return;
    setActiveCell({ rowIndex, colKey });
    const currentNum = getCellNumericValue(rowIndex, colKey);
    setEditDraftValue(
      initialOverride !== undefined ? initialOverride : String(currentNum)
    );
    setIsEditingCell(true);
  };

  // Confirmar edición inline de la celda activa y aplicar mutación optimista
  const commitCellEdit = (rowIndex: number, colKey: EditableColKey, rawVal: string) => {
    const row = enrichedRows[rowIndex];
    if (!row) return;
    const { product, totalStock, avgCost } = row;
    const cleanDigits = rawVal.replace(/[^\d]/g, "");
    if (!cleanDigits) {
      setIsEditingCell(false);
      return;
    }
    const parsedNum = Math.max(0, parseInt(cleanDigits, 10) || 0);

    if (colKey === "stock") {
      if (parsedNum !== totalStock) {
        if (product.batches.length === 0) {
          updateProduct({
            ...product,
            batches: [
              {
                id: `batch-${Date.now()}`,
                supplierId: suppliers[0]?.id || "sup-default",
                cost: 0,
                stock: parsedNum,
              },
            ],
          });
        } else {
          adjustMasterStock(product.id, parsedNum - totalStock);
        }
      }
    } else if (colKey === "cost" && showCosts) {
      if (parsedNum !== avgCost) {
        if (product.batches.length === 0) {
          updateProduct({
            ...product,
            batches: [
              {
                id: `batch-${Date.now()}`,
                supplierId: suppliers[0]?.id || "sup-default",
                cost: parsedNum,
                stock: 0,
              },
            ],
          });
        } else {
          updateProduct({
            ...product,
            batches: product.batches.map((b) => ({
              ...b,
              cost: parsedNum,
            })),
          });
        }
      }
    } else if (colKey === "price") {
      if (parsedNum !== product.price && parsedNum > 0) {
        updateProductPrice(product.id, parsedNum);
      }
    }

    setIsEditingCell(false);
  };

  // Navegación con teclado dentro de una celda enfocada o en edición
  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colKey: EditableColKey
  ) => {
    const maxRow = enrichedRows.length - 1;
    const effectiveCols: EditableColKey[] = quickCountMode
      ? ["stock"]
      : editableColumns;
    const colIdx = effectiveCols.indexOf(colKey);

    if (isEditingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commitCellEdit(rowIndex, colKey, editDraftValue);
        // Bajar automáticamente a la misma columna de la fila siguiente (flujo Excel)
        if (rowIndex < maxRow) {
          setActiveCell({ rowIndex: rowIndex + 1, colKey });
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsEditingCell(false);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        commitCellEdit(rowIndex, colKey, editDraftValue);
        moveFocusTab(rowIndex, colIdx, effectiveCols, e.shiftKey);
        return;
      }
      return;
    }

    // Modo Foco (sin edición activa)
    if (e.key === "Enter") {
      e.preventDefault();
      startEditingCell(rowIndex, colKey);
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      const row = enrichedRows[rowIndex];
      if (row) onInspectProduct(row.product);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < maxRow) {
        setActiveCell({ rowIndex: rowIndex + 1, colKey });
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        setActiveCell({ rowIndex: rowIndex - 1, colKey });
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (colIdx < effectiveCols.length - 1) {
        setActiveCell({ rowIndex, colKey: effectiveCols[colIdx + 1] });
      } else if (rowIndex < maxRow) {
        setActiveCell({ rowIndex: rowIndex + 1, colKey: effectiveCols[0] });
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (colIdx > 0) {
        setActiveCell({ rowIndex, colKey: effectiveCols[colIdx - 1] });
      } else if (rowIndex > 0) {
        setActiveCell({
          rowIndex: rowIndex - 1,
          colKey: effectiveCols[effectiveCols.length - 1],
        });
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      moveFocusTab(rowIndex, colIdx, effectiveCols, e.shiftKey);
      return;
    }

    // Entrada numérica directa sobre celda enfocada (0-9) estilo Excel
    if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      startEditingCell(rowIndex, colKey, e.key);
    }
  };

  const moveFocusTab = (
    rowIndex: number,
    colIdx: number,
    cols: EditableColKey[],
    isShift: boolean
  ) => {
    const maxRow = enrichedRows.length - 1;
    if (!isShift) {
      if (colIdx < cols.length - 1) {
        setActiveCell({ rowIndex, colKey: cols[colIdx + 1] });
      } else if (rowIndex < maxRow) {
        setActiveCell({ rowIndex: rowIndex + 1, colKey: cols[0] });
      }
    } else {
      if (colIdx > 0) {
        setActiveCell({ rowIndex, colKey: cols[colIdx - 1] });
      } else if (rowIndex > 0) {
        setActiveCell({
          rowIndex: rowIndex - 1,
          colKey: cols[cols.length - 1],
        });
      }
    }
  };

  // Manejo de Fila de Inserción Rápida (Quick-Add Inline Row)
  const handleQuickAddSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const cleanName = quickName.trim();
    const parsedPrice = parseCOPInput(quickPrice);
    if (!cleanName || parsedPrice <= 0) return;

    const parsedStock = Math.max(0, parseInt(quickStock, 10) || 0);
    const parsedCost = showCosts ? parseCOPInput(quickCost) : 0;
    const defaultSupplierId = suppliers[0]?.id || "sup-default";

    addProduct({
      name: cleanName,
      category: quickCategory,
      subtitle: quickCategory,
      price: parsedPrice,
      warrantyDays: 15,
      batches: [
        {
          id: `batch-${Date.now()}`,
          supplierId: defaultSupplierId,
          cost: parsedCost,
          stock: parsedStock,
        },
      ],
    });

    // Limpiar campos y mantener foco en el campo Nombre para ingreso en serie
    setQuickName("");
    setQuickStock("1");
    setQuickCost("");
    setQuickPrice("");
    requestAnimationFrame(() => {
      quickNameInputRef.current?.focus();
    });
  };

  const handleQuickRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAddSubmit(e);
    }
  };

  // Selección de filas para acciones en lote
  const allVisibleSelected =
    enrichedRows.length > 0 &&
    enrichedRows.every((r) => selectedIds.has(r.product.id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(enrichedRows.map((r) => r.product.id)));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Acciones rápidas por fila
  const handleQuickAddToCart = (productId: string) => {
    const ok = addToCart(productId);
    if (ok) {
      setAddedCartId(productId);
      setTimeout(() => {
        setAddedCartId((prev) => (prev === productId ? null : prev));
      }, 900);
    }
  };

  const handleDuplicateRow = (product: Product) => {
    addProduct({
      name: `${product.name} (Copia)`,
      category: product.category,
      subtitle: product.subtitle,
      price: product.price,
      warrantyDays: product.warrantyDays,
      batches: product.batches.map((b) => ({
        ...b,
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    });
  };

  const handleDeleteRow = (product: Product) => {
    if (window.confirm(`¿Eliminar "${product.name}" del inventario?`)) {
      deleteProduct(product.id);
    }
  };

  // Acciones en Lote (Bulk Actions)
  const handleBulkCategoryChange = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const p = products.find((item) => item.id === id);
      if (p) {
        updateProduct({ ...p, category: bulkCategory });
      }
    });
    setSelectedIds(new Set());
  };

  const handleBulkStockDelta = (delta: number) => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      adjustMasterStock(id, delta);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `¿Eliminar las ${selectedIds.size} referencias seleccionadas del inventario?`
      )
    ) {
      await deleteMultipleProducts(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col || !sortDirection) {
      return <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-80" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-accent" />
    ) : (
      <ArrowDown size={12} className="text-accent" />
    );
  };

  return (
    <div
      data-testid="desktop-inventory-grid-wrapper"
      className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden"
    >
      {/* Banner informativo sutil cuando Modo Conteo Rápido está activo */}
      {quickCountMode && (
        <div
          data-testid="quick-count-mode-banner"
          className="flex items-center justify-between border-b border-accent/30 bg-accent-subtle px-4 py-2 text-xs"
        >
          <div className="flex items-center gap-2 font-bold text-accent">
            <Sparkles size={14} />
            <span>
              MODO CONTEO RÁPIDO ACTIVO: Digita la cantidad física y presiona{" "}
              <kbd className="rounded border border-accent/40 bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-extrabold">
                Enter ↵
              </kbd>{" "}
              para guardar y avanzar a la fila siguiente.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Usa ↑ / ↓ para desplazarte · Esc para cancelar
          </span>
        </div>
      )}

      {/* Contenedor de Tabla con Scroll Horizontal Seguro */}
      <div className="overflow-x-auto">
        <table
          data-testid="desktop-inventory-table"
          className="w-full border-collapse text-left"
        >
          {/* Cabecera Fija (Sticky Top) con Desenfoque Translúcido y Bordes Milimétricos */}
          <thead className="sticky top-0 z-10 backdrop-blur-md bg-[var(--bg-elevated)]/95 border-b border-[var(--border-color)] select-none">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {/* 1. [✓] / Nº (48px) */}
              <th className="w-12 border-r border-[var(--border-color)] px-2.5 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Seleccionar todas las filas visibles"
                    className="h-3.5 w-3.5 rounded accent-[var(--accent-primary)] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleToggleSort("index")}
                    className="group inline-flex items-center gap-0.5 hover:text-[var(--text-primary)]"
                    title="Ordenar por Nº consecutivo"
                  >
                    <span>Nº</span>
                  </button>
                </div>
              </th>

              {/* 2. Artículo / Referencia (min-w-[260px]) */}
              <th className="min-w-[260px] border-r border-[var(--border-color)] px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("name")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "name" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Artículo / Referencia</span>
                  {renderSortIcon("name")}
                </button>
              </th>

              {/* 3. Categoría (160px) */}
              <th className="w-[160px] border-r border-[var(--border-color)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("category")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "category" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Categoría</span>
                  {renderSortIcon("category")}
                </button>
              </th>

              {/* 4. Stock / Cantidad (120px) */}
              <th className="w-[120px] border-r border-[var(--border-color)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("stock")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "stock" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Stock</span>
                  {renderSortIcon("stock")}
                </button>
              </th>

              {/* 5. Costo / Mayor (140px) */}
              <th className="w-[140px] border-r border-[var(--border-color)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("cost")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "cost" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Costo / Mayor</span>
                  {renderSortIcon("cost")}
                </button>
              </th>

              {/* 6. Precio Sugerido (Venta) (150px) */}
              <th className="w-[150px] border-r border-[var(--border-color)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("price")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "price" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Precio Sugerido</span>
                  {renderSortIcon("price")}
                </button>
              </th>

              {/* 7. Utilidad / Margen (120px) */}
              <th className="w-[120px] border-r border-[var(--border-color)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSort("profit")}
                  className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
                    sortColumn === "profit" && sortDirection ? "text-accent" : ""
                  }`}
                >
                  <span>Utilidad</span>
                  {renderSortIcon("profit")}
                </button>
              </th>

              {/* 8. Acciones Rápidas (110px) */}
              <th className="w-[110px] px-2.5 py-2.5 text-center">
                <span>Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-color)] text-xs">
            {/* Fila Permanente de Inserción Rápida (+ Quick-Add Inline Row) */}
            <tr
              data-testid="desktop-quick-add-row"
              className="bg-accent-subtle/40 dark:bg-white/[0.02] transition-colors duration-150"
            >
              <td className="border-r border-[var(--border-color)] px-2 py-2 text-center font-extrabold text-accent">
                +
              </td>
              <td className="border-r border-[var(--border-color)] px-2.5 py-1.5">
                <input
                  ref={quickNameInputRef}
                  data-testid="quick-add-name-input"
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={handleQuickRowKeyDown}
                  placeholder="+ Creación rápida en línea (Nombre / Referencia)... [Ctrl+N]"
                  className="w-full rounded-lg border border-transparent focus:border-accent bg-transparent px-2 py-1 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors duration-150"
                />
              </td>
              <td className="border-r border-[var(--border-color)] px-2 py-1.5">
                <select
                  data-testid="quick-add-category-select"
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as ProductCategory)}
                  onKeyDown={handleQuickRowKeyDown}
                  aria-label="Categoría para creación rápida"
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                >
                  {catalogConfig.categoryOrder.map((cat) => (
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
                  value={quickStock}
                  onChange={(e) => setQuickStock(e.target.value)}
                  onKeyDown={handleQuickRowKeyDown}
                  placeholder="Stock"
                  aria-label="Stock inicial para creación rápida"
                  className="tabular-nums w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-center text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </td>
              <td className="border-r border-[var(--border-color)] px-2 py-1.5">
                {showCosts ? (
                  <input
                    data-testid="quick-add-cost-input"
                    type="text"
                    inputMode="numeric"
                    value={quickCost}
                    onChange={(e) => {
                      const n = parseCOPInput(e.target.value);
                      setQuickCost(n > 0 ? formatCOP(n) : "");
                    }}
                    onKeyDown={handleQuickRowKeyDown}
                    placeholder="$ Costo"
                    aria-label="Costo para creación rápida"
                    className="tabular-nums w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 text-right text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                ) : (
                  <div className="px-2 py-1 text-right text-[11px] font-semibold text-[var(--text-secondary)] select-none">
                    ••••••
                  </div>
                )}
              </td>
              <td className="border-r border-[var(--border-color)] px-2 py-1.5">
                <input
                  data-testid="quick-add-price-input"
                  type="text"
                  inputMode="numeric"
                  value={quickPrice}
                  onChange={(e) => {
                    const n = parseCOPInput(e.target.value);
                    setQuickPrice(n > 0 ? formatCOP(n) : "");
                  }}
                  onKeyDown={handleQuickRowKeyDown}
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
                  onClick={handleQuickAddSubmit}
                  disabled={!quickName.trim() || parseCOPInput(quickPrice) <= 0}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all duration-150"
                >
                  <Plus size={13} />
                  <span>Crear</span>
                </button>
              </td>
            </tr>

            {/* Filas de Productos del Inventario */}
            {enrichedRows.map((row, rowIndex) => {
              const {
                product,
                originalIndex,
                totalStock,
                avgCost,
                profit,
                marginPct,
                attributeBadges,
              } = row;
              const isSelected = selectedIds.has(product.id);

              const isStockFocused =
                activeCell?.rowIndex === rowIndex && activeCell?.colKey === "stock";
              const isCostFocused =
                activeCell?.rowIndex === rowIndex && activeCell?.colKey === "cost";
              const isPriceFocused =
                activeCell?.rowIndex === rowIndex && activeCell?.colKey === "price";

              // Semáforo de Stock
              const stockBadgeClasses =
                totalStock > 5
                  ? "bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30"
                  : totalStock > 0
                  ? "bg-[#ff9500]/15 text-[#ff9500] border-[#ff9500]/30"
                  : "bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/30";

              return (
                <tr
                  key={product.id}
                  data-testid={`desktop-grid-row-${rowIndex}`}
                  onDoubleClick={() => onInspectProduct(product)}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('input, button, a, [contenteditable="true"]')) return;
                    handleToggleRowSelect(product.id);
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
                        checked={isSelected}
                        onChange={() => handleToggleRowSelect(product.id)}
                        aria-label={`Seleccionar ${product.name}`}
                        className={`h-3.5 w-3.5 rounded accent-[var(--accent-primary)] cursor-pointer transition-opacity duration-150 ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-30 group-hover:opacity-100"
                        }`}
                      />
                      <span className="tabular-nums text-[11px] font-bold text-[var(--text-secondary)]">
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
                          onClick={() => onInspectProduct(product)}
                          className="text-left font-bold text-[13px] text-[var(--text-primary)] hover:text-accent transition-colors duration-150 truncate block max-w-full"
                          title="Clic para abrir el panel de inspección y atributos avanzados"
                        >
                          {product.name}
                        </button>

                        {attributeBadges.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {attributeBadges.map((badge, bIdx) => (
                              <span
                                key={`${product.id}-attr-${bIdx}`}
                                className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Puntos de color de lotes por proveedor */}
                      <div className="flex items-center gap-1 shrink-0">
                        {product.batches
                          .filter((b) => b.stock > 0)
                          .map((b) => {
                            const sup = getSupplier(b.supplierId);
                            return (
                              <span
                                key={b.id}
                                title={`${sup?.name ?? "Proveedor"}: ${b.stock} uds`}
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: sup?.color ?? "#007aff" }}
                              />
                            );
                          })}
                      </div>
                    </div>
                  </td>

                  {/* 3. Categoría (160px) */}
                  <td className="w-[160px] border-r border-[var(--border-color)] px-3 py-2">
                    <span className="inline-flex max-w-full truncate rounded-full border border-accent/25 bg-accent-subtle px-2.5 py-0.5 text-[11px] font-bold text-accent">
                      {product.category}
                    </span>
                  </td>

                  {/* 4. Stock / Cantidad (120px - Editable Inline) */}
                  <td className="w-[120px] border-r border-[var(--border-color)] p-0">
                    <div
                      ref={(el) => {
                        const key = `${rowIndex}:stock`;
                        if (el) cellRefs.current.set(key, el);
                        else cellRefs.current.delete(key);
                      }}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`Stock de ${product.name}`}
                      data-testid={`grid-cell-stock-${rowIndex}`}
                      onClick={() => {
                        if (!isStockFocused) {
                          setActiveCell({ rowIndex, colKey: "stock" });
                          setIsEditingCell(false);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingCell(rowIndex, "stock");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "stock")}
                      className={`flex h-full min-h-[42px] items-center justify-between px-2 py-1.5 outline-none cursor-pointer select-none transition-all duration-150 ${
                        isStockFocused
                          ? "ring-2 ring-inset ring-accent bg-accent-subtle"
                          : ""
                      }`}
                    >
                      {isStockFocused && isEditingCell ? (
                        <input
                          ref={activeInputRef}
                          data-testid={`grid-input-stock-${rowIndex}`}
                          type="text"
                          inputMode="numeric"
                          value={editDraftValue}
                          onChange={(e) => setEditDraftValue(e.target.value)}
                          onBlur={() =>
                            commitCellEdit(rowIndex, "stock", editDraftValue)
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "stock")}
                          className="tabular-nums w-full rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-center text-xs font-extrabold text-[var(--text-primary)] outline-none ring-1 ring-accent"
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustMasterStock(product.id, -1);
                            }}
                            disabled={totalStock <= 0}
                            aria-label={`Disminuir stock de ${product.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity duration-150"
                          >
                            <Minus size={11} />
                          </button>

                          <span
                            className={`tabular-nums inline-flex min-w-[44px] items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-extrabold ${stockBadgeClasses}`}
                          >
                            {totalStock}
                          </span>

                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustMasterStock(product.id, 1);
                            }}
                            aria-label={`Aumentar stock de ${product.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          >
                            <Plus size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  {/* 5. Costo / Mayor (140px - Editable Inline / Protegido por Privacidad) */}
                  <td className="w-[140px] border-r border-[var(--border-color)] p-0">
                    {showCosts ? (
                      <div
                        ref={(el) => {
                          const key = `${rowIndex}:cost`;
                          if (el) cellRefs.current.set(key, el);
                          else cellRefs.current.delete(key);
                        }}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`Costo de ${product.name}`}
                        data-testid={`grid-cell-cost-${rowIndex}`}
                        onClick={() => {
                          if (!isCostFocused) {
                            setActiveCell({ rowIndex, colKey: "cost" });
                            setIsEditingCell(false);
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingCell(rowIndex, "cost");
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "cost")}
                        className={`flex h-full min-h-[42px] items-center justify-end px-3 py-1.5 outline-none cursor-pointer select-none transition-all duration-150 ${
                          isCostFocused
                            ? "ring-2 ring-inset ring-accent bg-accent-subtle"
                            : ""
                        }`}
                      >
                        {isCostFocused && isEditingCell ? (
                          <input
                            ref={activeInputRef}
                            data-testid={`grid-input-cost-${rowIndex}`}
                            type="text"
                            inputMode="numeric"
                            value={editDraftValue}
                            onChange={(e) => setEditDraftValue(e.target.value)}
                            onBlur={() =>
                              commitCellEdit(rowIndex, "cost", editDraftValue)
                            }
                            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "cost")}
                            className="tabular-nums w-full rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-right text-xs font-extrabold text-[var(--text-primary)] outline-none ring-1 ring-accent"
                          />
                        ) : (
                          <span className="tabular-nums font-semibold text-[var(--text-secondary)]">
                            {formatCOP(avgCost)}
                          </span>
                        )}
                      </div>
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

                  {/* 6. Precio Sugerido (Venta) (150px - Editable Inline) */}
                  <td className="w-[150px] border-r border-[var(--border-color)] p-0">
                    <div
                      ref={(el) => {
                        const key = `${rowIndex}:price`;
                        if (el) cellRefs.current.set(key, el);
                        else cellRefs.current.delete(key);
                      }}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`Precio sugerido de ${product.name}`}
                      data-testid={`grid-cell-price-${rowIndex}`}
                      onClick={() => {
                        if (!isPriceFocused) {
                          setActiveCell({ rowIndex, colKey: "price" });
                          setIsEditingCell(false);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingCell(rowIndex, "price");
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "price")}
                      className={`flex h-full min-h-[42px] items-center justify-end px-3 py-1.5 outline-none cursor-pointer select-none transition-all duration-150 ${
                        isPriceFocused
                          ? "ring-2 ring-inset ring-accent bg-accent-subtle"
                          : ""
                      }`}
                    >
                      {isPriceFocused && isEditingCell ? (
                        <input
                          ref={activeInputRef}
                          data-testid={`grid-input-price-${rowIndex}`}
                          type="text"
                          inputMode="numeric"
                          value={editDraftValue}
                          onChange={(e) => setEditDraftValue(e.target.value)}
                          onBlur={() =>
                            commitCellEdit(rowIndex, "price", editDraftValue)
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, "price")}
                          className="tabular-nums w-full rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-right text-xs font-extrabold text-[var(--text-primary)] outline-none ring-1 ring-accent"
                        />
                      ) : (
                        <span className="tabular-nums text-[13px] font-extrabold text-[var(--text-primary)]">
                          {formatCOP(product.price)}
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddToCart(product.id);
                        }}
                        disabled={totalStock <= 0}
                        title="Agregar al carrito de venta"
                        aria-label={`Agregar ${product.name} al carrito`}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-150 ${
                          addedCartId === product.id
                            ? "border-[#30d158] bg-[#30d158] text-white"
                            : "border-transparent hover:border-accent/40 hover:bg-accent-subtle text-[var(--text-secondary)] hover:text-accent disabled:opacity-30"
                        }`}
                      >
                        {addedCartId === product.id ? (
                          <Check size={13} />
                        ) : (
                          <ShoppingCart size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectProduct(product);
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
                          handleDuplicateRow(product);
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
                          handleDeleteRow(product);
                        }}
                        title="Eliminar referencia"
                        aria-label={`Eliminar ${product.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all duration-150"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pie de Tabla con Guía de Atajos Keyboard-First */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-[11px] text-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-bold">
              ↑ ↓ ← →
            </kbd>{" "}
            Navegar celdas
          </span>
          <span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-bold">
              Enter ↵
            </kbd>{" "}
            Editar / Guardar y bajar
          </span>
          <span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-bold">
              Tab
            </kbd>{" "}
            Siguiente columna
          </span>
          <span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-bold">
              Espacio
            </kbd>{" "}
            Abrir Inspector
          </span>
          <span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-bold">
              Alt+M
            </kbd>{" "}
            Conteo Rápido
          </span>
        </div>

        <div className="font-semibold">
          {enrichedRows.length} referencias en tabla
        </div>
      </footer>

      {/* Barra Flotante de Acciones en Lote (Bulk Actions Bar) */}
      {selectedIds.size > 0 && (
        <div
          data-testid="desktop-bulk-actions-bar"
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-accent bg-[var(--bg-elevated)] px-4 py-2.5 shadow-accent-glow animate-in fade-in duration-150"
        >
          <span className="rounded-lg bg-accent px-2.5 py-1 text-xs font-extrabold text-white tabular-nums">
            {selectedIds.size} seleccionados
          </span>

          {/* Cambiar categoría en lote */}
          <div className="flex items-center gap-1.5 border-l border-[var(--border-color)] pl-3">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value as ProductCategory)}
              aria-label="Seleccionar nueva categoría en lote"
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
            >
              {catalogConfig.categoryOrder.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkCategoryChange}
              className="rounded-xl bg-accent-subtle px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-colors duration-150"
            >
              Mover categoría
            </button>
          </div>

          {/* Ajustar stock en lote */}
          <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-3">
            <button
              type="button"
              onClick={() => handleBulkStockDelta(-1)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent transition-colors duration-150"
            >
              -1 Stock
            </button>
            <button
              type="button"
              onClick={() => handleBulkStockDelta(1)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent transition-colors duration-150"
            >
              +1 Stock
            </button>
          </div>

          {/* Eliminar seleccionados */}
          <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-3">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-150"
            >
              <Trash2 size={13} />
              <span>Eliminar</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              title="Limpiar selección"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
