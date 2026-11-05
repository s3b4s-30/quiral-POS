import {
  ArrowDown,
  ShoppingCart,
  ArrowUp,
  ArrowUpDown,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInventory } from "../../../context/InventoryContext";
import { useScrollParentVirtualizer } from "../../../hooks/useScrollParentVirtualizer";
import { Product, ProductCategory, Supplier } from "../../../types/domain";
import {
  type EditableColKey,
  type EnrichedRow,
  type GridHandlers,
  InventoryGridRow,
  type QuickAddPayload,
  QuickAddRow,
} from "./DesktopInventoryGridParts";

export type { EditableColKey } from "./DesktopInventoryGridParts";

type SortColumn =
  "index" | "name" | "category" | "stock" | "cost" | "price" | "profit";
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
  onOpenNewProduct?: () => void;
  onCloneProduct?: (product: Product) => void;
}

/** Altura estimada (px) de una fila antes de su medición real en el DOM. */
const ESTIMATED_ROW_HEIGHT = 58;

export default function DesktopInventoryGrid({
  products,
  onInspectProduct,
  quickCountMode,
  focusQuickAddRef,
  onOpenNewProduct,
  onCloneProduct,
}: DesktopInventoryGridProps) {
  const {
    suppliers,
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

  const quickNameInputRef = useRef<HTMLInputElement | null>(null);
  const rowsBodyRef = useRef<HTMLTableSectionElement>(null);

  // Referencias para enfoque programático de celdas e inputs
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const hasSelectedInputRef = useRef(false);

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

  // Índice de proveedores O(1) para los puntos de color (evita búsquedas lineales por fila)
  const supplierMap = useMemo(
    () => new Map<string, Supplier>(suppliers.map((s) => [s.id, s])),
    [suppliers]
  );

  // Calcular métricas derivadas por fila y aplicar ordenamiento de columna
  const enrichedRows = useMemo<EnrichedRow[]>(() => {
    const base = products.map((product, idx) => {
      const totalStock = product.batches.reduce((sum, b) => sum + b.stock, 0);
      const totalBatchCost = product.batches.reduce(
        (sum, b) => sum + b.cost * b.stock,
        0
      );
      const avgCost =
        totalStock > 0
          ? Math.round(totalBatchCost / totalStock)
          : (product.batches[0]?.cost ?? 0);
      const profit = product.price - avgCost;
      const marginPct = avgCost > 0 ? Math.round((profit / avgCost) * 100) : 0;

      const attributeBadges = (product.subtitle || "")
        .split("·")
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 0 && s.toLowerCase() !== product.category.toLowerCase()
        );

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

  // Virtualización sobre el contenedor de scroll de la vista (#inventory-scroll)
  const getRowKey = useCallback(
    (index: number) => enrichedRows[index]?.product.id ?? index,
    [enrichedRows]
  );
  const virtual = useScrollParentVirtualizer({
    count: enrichedRows.length,
    scrollElementId: "inventory-scroll",
    anchorRef: rowsBodyRef,
    estimateSize: ESTIMATED_ROW_HEIGHT,
    overscan: 12,
    getItemKey: getRowKey,
  });
  const measureRowRef = virtual.enabled
    ? virtual.virtualizer.measureElement
    : undefined;

  /* ------------------------------------------------------------------------ */
  /*  "Latest-ref": snapshot del estado vigente para manejadores estables.     */
  /*  Los callbacks se crean UNA sola vez (useCallback con deps vacías) y leen */
  /*  siempre los valores actuales, evitando invalidar React.memo en filas.    */
  /* ------------------------------------------------------------------------ */
  const latestRef = useRef({
    enrichedRows,
    editableColumns,
    quickCountMode,
    showCosts,
    isEditingCell,
    editDraftValue,
    suppliers,
    onInspectProduct,
    onOpenNewProduct,
    onCloneProduct,
    addToCart,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustMasterStock,
    updateProductPrice,
  });
  useLayoutEffect(() => {
    latestRef.current = {
      enrichedRows,
      editableColumns,
      quickCountMode,
      showCosts,
      isEditingCell,
      editDraftValue,
      suppliers,
      onInspectProduct,
      onOpenNewProduct,
      onCloneProduct,
      addToCart,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustMasterStock,
      updateProductPrice,
    };
  });

  // Cuando se activa Modo Conteo Rápido (Alt + M), enfocar automáticamente la celda Stock de la fila 0
  useEffect(() => {
    if (quickCountMode && latestRef.current.enrichedRows.length > 0) {
      setActiveCell({ rowIndex: 0, colKey: "stock" });
      setIsEditingCell(false);
    }
  }, [quickCountMode]);

  // Sincronizar el foco del DOM con la celda activa (desplazando el virtualizador si es necesario)
  const { enabled: isVirtualized, virtualizer } = virtual;
  useEffect(() => {
    if (!activeCell) return;
    if (isVirtualized) {
      virtualizer.scrollToIndex(activeCell.rowIndex, { align: "auto" });
    }

    const applyFocus = () => {
      if (isEditingCell) {
        if (!hasSelectedInputRef.current && activeInputRef.current) {
          activeInputRef.current.focus();
          activeInputRef.current.select();
          hasSelectedInputRef.current = true;
        }
      } else {
        hasSelectedInputRef.current = false;
        const el = cellRefs.current.get(
          `${activeCell.rowIndex}:${activeCell.colKey}`
        );
        el?.focus({ preventScroll: false });
      }
    };

    if (isVirtualized) {
      // Doble frame: el primero monta la fila destino, el segundo la enfoca
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(applyFocus);
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    if (isEditingCell) {
      const raf = requestAnimationFrame(applyFocus);
      return () => cancelAnimationFrame(raf);
    }
    applyFocus();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCell?.rowIndex, activeCell?.colKey, isEditingCell, isVirtualized]);

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

  const handleToggleSort = useCallback((col: SortColumn) => {
    setSortColumn((prevCol) => {
      if (prevCol !== col) {
        setSortDirection("asc");
        return col;
      }
      setSortDirection((prevDir) =>
        prevDir === "asc" ? "desc" : prevDir === "desc" ? null : "asc"
      );
      return prevCol;
    });
  }, []);

  /* ------------------------------ Motor Excel ------------------------------ */

  const getCellNumericValue = useCallback(
    (rowIndex: number, colKey: EditableColKey): number => {
      const row = latestRef.current.enrichedRows[rowIndex];
      if (!row) return 0;
      if (colKey === "stock") return row.totalStock;
      if (colKey === "cost") return row.avgCost;
      return row.product.price;
    },
    []
  );

  const focusCell = useCallback((rowIndex: number, colKey: EditableColKey) => {
    setActiveCell((prev) =>
      prev && prev.rowIndex === rowIndex && prev.colKey === colKey
        ? prev
        : { rowIndex, colKey }
    );
    setIsEditingCell(false);
  }, []);

  const startEditing = useCallback(
    (rowIndex: number, colKey: EditableColKey, initialOverride?: string) => {
      const { showCosts: costsVisible, enrichedRows: rows } = latestRef.current;
      if (colKey === "cost" && !costsVisible) return;
      if (!rows[rowIndex]) return;
      hasSelectedInputRef.current = initialOverride !== undefined;
      setActiveCell({ rowIndex, colKey });
      setEditDraftValue(
        initialOverride !== undefined
          ? initialOverride
          : String(getCellNumericValue(rowIndex, colKey))
      );
      setIsEditingCell(true);
    },
    [getCellNumericValue]
  );

  // Confirmar edición inline y aplicar mutación optimista
  const commitEdit = useCallback(
    (rowIndex: number, colKey: EditableColKey, rawVal: string) => {
      const s = latestRef.current;
      const row = s.enrichedRows[rowIndex];
      if (!row) return;
      const { product, totalStock, avgCost } = row;
      const cleanDigits = rawVal.replace(/[^\d]/g, "");
      if (!cleanDigits) {
        setIsEditingCell(false);
        return;
      }
      const parsedNum = Math.max(0, parseInt(cleanDigits, 10) || 0);
      const defaultSupplierId = s.suppliers[0]?.id || "sup-default";

      if (colKey === "stock") {
        if (parsedNum !== totalStock) {
          if (product.batches.length === 0) {
            s.updateProduct({
              ...product,
              batches: [
                {
                  id: `batch-${Date.now()}`,
                  supplierId: defaultSupplierId,
                  cost: 0,
                  stock: parsedNum,
                },
              ],
            });
          } else {
            s.adjustMasterStock(product.id, parsedNum - totalStock);
          }
        }
      } else if (colKey === "cost" && s.showCosts) {
        if (parsedNum !== avgCost) {
          if (product.batches.length === 0) {
            s.updateProduct({
              ...product,
              batches: [
                {
                  id: `batch-${Date.now()}`,
                  supplierId: defaultSupplierId,
                  cost: parsedNum,
                  stock: 0,
                },
              ],
            });
          } else {
            s.updateProduct({
              ...product,
              batches: product.batches.map((b) => ({ ...b, cost: parsedNum })),
            });
          }
        }
      } else if (colKey === "price") {
        if (parsedNum !== product.price && parsedNum > 0) {
          s.updateProductPrice(product.id, parsedNum);
        }
      }

      setIsEditingCell(false);
    },
    []
  );

  const moveFocusTab = useCallback(
    (
      rowIndex: number,
      colIdx: number,
      cols: EditableColKey[],
      isShift: boolean
    ) => {
      const maxRow = latestRef.current.enrichedRows.length - 1;
      if (!isShift) {
        if (colIdx < cols.length - 1) {
          setActiveCell({ rowIndex, colKey: cols[colIdx + 1] });
        } else if (rowIndex < maxRow) {
          setActiveCell({ rowIndex: rowIndex + 1, colKey: cols[0] });
        }
      } else if (colIdx > 0) {
        setActiveCell({ rowIndex, colKey: cols[colIdx - 1] });
      } else if (rowIndex > 0) {
        setActiveCell({
          rowIndex: rowIndex - 1,
          colKey: cols[cols.length - 1],
        });
      }
    },
    []
  );

  // Navegación matricial con teclado (↑ ↓ ← → Enter Tab Esc Espacio y dígitos)
  const cellKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, colKey: EditableColKey) => {
      const s = latestRef.current;
      const maxRow = s.enrichedRows.length - 1;
      const effectiveCols: EditableColKey[] = s.quickCountMode
        ? ["stock"]
        : s.editableColumns;
      const colIdx = effectiveCols.indexOf(colKey);

      if (s.isEditingCell) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          commitEdit(rowIndex, colKey, s.editDraftValue);
          // Bajar automáticamente a la misma columna de la fila siguiente (flujo Excel)
          if (rowIndex < maxRow)
            setActiveCell({ rowIndex: rowIndex + 1, colKey });
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
          commitEdit(rowIndex, colKey, s.editDraftValue);
          moveFocusTab(rowIndex, colIdx, effectiveCols, e.shiftKey);
        }
        return;
      }

      // Modo Foco (sin edición activa)
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          startEditing(rowIndex, colKey);
          return;
        case " ": {
          e.preventDefault();
          const row = s.enrichedRows[rowIndex];
          if (row) s.onInspectProduct(row.product);
          return;
        }
        case "ArrowDown":
          e.preventDefault();
          if (rowIndex < maxRow)
            setActiveCell({ rowIndex: rowIndex + 1, colKey });
          return;
        case "ArrowUp":
          e.preventDefault();
          if (rowIndex > 0) setActiveCell({ rowIndex: rowIndex - 1, colKey });
          return;
        case "ArrowRight":
          e.preventDefault();
          if (colIdx < effectiveCols.length - 1) {
            setActiveCell({ rowIndex, colKey: effectiveCols[colIdx + 1] });
          } else if (rowIndex < maxRow) {
            setActiveCell({ rowIndex: rowIndex + 1, colKey: effectiveCols[0] });
          }
          return;
        case "ArrowLeft":
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
        case "Tab":
          e.preventDefault();
          moveFocusTab(rowIndex, colIdx, effectiveCols, e.shiftKey);
          return;
        default:
          // Entrada numérica directa sobre celda enfocada (0-9) estilo Excel
          if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            startEditing(rowIndex, colKey, e.key);
          }
      }
    },
    [commitEdit, moveFocusTab, startEditing]
  );

  /* ---------------------------- Acciones por fila --------------------------- */

  const toggleRowSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleQuickAddToCart = useCallback((productId: string) => {
    const ok = latestRef.current.addToCart(productId);
    if (ok) {
      setAddedCartId(productId);
      setTimeout(() => {
        setAddedCartId((prev) => (prev === productId ? null : prev));
      }, 900);
    }
  }, []);

  const handleDuplicateRow = useCallback((product: Product) => {
    if (latestRef.current.onCloneProduct) {
      latestRef.current.onCloneProduct(product);
    } else if (latestRef.current.onOpenNewProduct) {
      latestRef.current.onOpenNewProduct();
    }
  }, []);

  const handleDeleteRow = useCallback((product: Product) => {
    if (window.confirm(`¿Eliminar "${product.name}" del inventario?`)) {
      latestRef.current.deleteProduct(product.id);
    }
  }, []);

  const registerCell = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  }, []);

  const registerActiveInput = useCallback((el: HTMLInputElement | null) => {
    activeInputRef.current = el;
    if (el && !hasSelectedInputRef.current) {
      el.focus();
      el.select();
      hasSelectedInputRef.current = true;
    }
  }, []);

  // Objeto de manejadores con identidad constante para toda la vida del componente
  const handlers = useMemo<GridHandlers>(
    () => ({
      focusCell,
      startEditing: (rowIndex, colKey) => startEditing(rowIndex, colKey),
      commitEdit,
      cellKeyDown,
      setDraft: setEditDraftValue,
      registerCell,
      registerActiveInput,
      toggleRowSelect,
      adjustStock: (productId, delta) =>
        latestRef.current.adjustMasterStock(productId, delta),
      addToCart: handleQuickAddToCart,
      inspect: (product) => latestRef.current.onInspectProduct(product),
      duplicate: handleDuplicateRow,
      remove: handleDeleteRow,
    }),
    [
      focusCell,
      startEditing,
      commitEdit,
      cellKeyDown,
      registerCell,
      registerActiveInput,
      toggleRowSelect,
      handleQuickAddToCart,
      handleDuplicateRow,
      handleDeleteRow,
    ]
  );

  // Alta desde la Fila de Inserción Rápida (estado local aislado en QuickAddRow)
  const handleQuickAddSubmit = useCallback((payload: QuickAddPayload) => {
    const s = latestRef.current;
    s.addProduct({
      name: payload.name,
      category: payload.category,
      subtitle: payload.category,
      price: payload.price,
      warrantyDays: 15,
      batches: [
        {
          id: `batch-${Date.now()}`,
          supplierId: s.suppliers[0]?.id || "sup-default",
          cost: payload.cost,
          stock: payload.stock,
        },
      ],
    });
  }, []);

  /* ------------------------------ Selección/Lote ---------------------------- */

  const allVisibleSelected = useMemo(
    () =>
      enrichedRows.length > 0 &&
      enrichedRows.every((r) => selectedIds.has(r.product.id)),
    [enrichedRows, selectedIds]
  );

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(enrichedRows.map((r) => r.product.id)));
    }
  };

  const [bulkCartSuccess, setBulkCartSuccess] = useState(false);

  const handleBulkAddToCart = useCallback(() => {
    if (selectedIds.size === 0) return;
    let addedCount = 0;
    selectedIds.forEach((id) => {
      const ok = latestRef.current.addToCart(id);
      if (ok) addedCount++;
    });
    if (addedCount > 0) {
      setBulkCartSuccess(true);
      setTimeout(() => setBulkCartSuccess(false), 2000);
    }
  }, [selectedIds]);

  const handleBulkCategoryChange = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const p = products.find((item) => item.id === id);
      if (p) updateProduct({ ...p, category: bulkCategory });
    });
    setSelectedIds(new Set());
  };

  const handleBulkStockDelta = (delta: number) => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => adjustMasterStock(id, delta));
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
      return (
        <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-80" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-accent" />
    ) : (
      <ArrowDown size={12} className="text-accent" />
    );
  };

  const renderSortableHeader = (
    col: SortColumn,
    label: string,
    widthClass: string
  ) => (
    <th
      className={`${widthClass} border-r border-[var(--border-color)] px-3 py-2.5`}
    >
      <button
        type="button"
        onClick={() => handleToggleSort(col)}
        className={`group flex w-full items-center justify-between hover:text-[var(--text-primary)] ${
          sortColumn === col && sortDirection ? "text-accent" : ""
        }`}
      >
        <span>{label}</span>
        {renderSortIcon(col)}
      </button>
    </th>
  );

  return (
    <div
      data-testid="desktop-inventory-grid-wrapper"
      data-virtualized={virtual.enabled ? "true" : "false"}
      className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden antialiased-hd"
    >
      {/* Barra de Acciones y Creación de la Estación de Trabajo Desktop */}
      <div
        data-testid="desktop-grid-action-bar"
        className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3 select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
              Catálogo de Inventario
            </span>
            <span className="tabular-nums rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">
              {enrichedRows.length} referencias
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-100">
              <span className="tabular-nums rounded-md bg-accent-subtle px-2 py-0.5 text-[11px] font-extrabold text-accent">
                {selectedIds.size} seleccionados
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 size={12} />
                <span>Eliminar en lote</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner informativo sutil cuando Modo Conteo Rápido está activo */}
      {quickCountMode && (
        <div
          data-testid="quick-count-mode-banner"
          className="flex items-center justify-between border-b border-accent/40 bg-[var(--bg-elevated)] dark:bg-black/95 px-4 py-2.5 antialiased-hd shadow-xs"
        >
          <div className="flex items-center gap-2.5 font-bold text-[var(--text-primary)]">
            <Zap size={16} className="text-accent shrink-0 fill-accent/20" />
            <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white select-none">
              Modo Conteo Rápido
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-none">
              Digita la cantidad física y presiona{" "}
              <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-xs font-black text-accent shadow-2xs">
                Enter ↵
              </kbd>{" "}
              para guardar y avanzar a la fila siguiente.
            </span>
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
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
          {/* Cabecera Fija con Bordes Milimétricos */}
          <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] select-none">
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

              {renderSortableHeader("category", "Categoría", "w-[160px]")}
              {renderSortableHeader("stock", "Stock", "w-[120px]")}
              {renderSortableHeader("cost", "Costo / Mayor", "w-[140px]")}
              {renderSortableHeader("price", "Precio Sugerido", "w-[150px]")}
              {renderSortableHeader("profit", "Utilidad", "w-[120px]")}

              {/* 8. Acciones Rápidas (110px) */}
              <th className="w-[110px] px-2.5 py-2.5 text-center">
                <span>Acciones</span>
              </th>
            </tr>
          </thead>

          {/* Fila Permanente de Inserción Rápida (+ Quick-Add Inline Row) */}
          <tbody className="divide-y divide-[var(--border-color)] text-xs border-b border-[var(--border-color)]">
            <QuickAddRow
              categoryOrder={catalogConfig.categoryOrder}
              showCosts={showCosts}
              inputRef={quickNameInputRef}
              onSubmit={handleQuickAddSubmit}
            />
          </tbody>

          {/* Filas de Productos (virtualizadas al superar el umbral) */}
          <tbody
            ref={rowsBodyRef}
            className="divide-y divide-[var(--border-color)] text-xs"
          >
            {virtual.paddingTop > 0 && (
              <tr aria-hidden="true" data-virtual-spacer="top">
                <td
                  colSpan={8}
                  style={{ height: virtual.paddingTop, padding: 0, border: 0 }}
                />
              </tr>
            )}

            {virtual.indexes.map((rowIndex) => {
              const row = enrichedRows[rowIndex];
              if (!row) return null;
              const isActiveRow = activeCell?.rowIndex === rowIndex;
              const rowIsEditing = isActiveRow && isEditingCell;
              return (
                <InventoryGridRow
                  key={row.product.id}
                  row={row}
                  rowIndex={rowIndex}
                  isSelected={selectedIds.has(row.product.id)}
                  activeColKey={isActiveRow ? activeCell.colKey : null}
                  isEditing={rowIsEditing}
                  draftValue={rowIsEditing ? editDraftValue : ""}
                  showCosts={showCosts}
                  isAddedToCart={addedCartId === row.product.id}
                  supplierMap={supplierMap}
                  handlers={handlers}
                  measureRef={measureRowRef}
                />
              );
            })}

            {virtual.paddingBottom > 0 && (
              <tr aria-hidden="true" data-virtual-spacer="bottom">
                <td
                  colSpan={8}
                  style={{
                    height: virtual.paddingBottom,
                    padding: 0,
                    border: 0,
                  }}
                />
              </tr>
            )}
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

        <div className="font-semibold tabular-nums">
          {enrichedRows.length} referencias en tabla
        </div>
      </footer>

      {/* Barra Flotante de Acciones en Lote (Glassmorfismo Puro & Layout Inflexible en 1 Fila) */}
      {selectedIds.size > 0 && (
        <div
          data-testid="desktop-bulk-actions-bar"
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex flex-row items-center justify-between gap-3 flex-nowrap w-max max-w-[95vw] mx-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)]/95 backdrop-blur-md px-4 py-2.5 shadow-2xl select-none animate-in fade-in slide-in-from-bottom-2 duration-150 text-[var(--text-primary)]"
        >
          {/* Badge contador */}
          <span className="shrink-0 whitespace-nowrap rounded-xl bg-accent px-3 py-1.5 text-xs font-extrabold text-white tabular-nums shadow-xs">
            {selectedIds.size} seleccionados
          </span>

          <div className="h-4 w-px bg-[var(--border-color)] shrink-0" />

          {/* Adición Masiva al Carrito de POS */}
          <button
            type="button"
            data-testid="desktop-bulk-add-to-cart-btn"
            onClick={handleBulkAddToCart}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-accent-glow active:scale-95 transition-all duration-150 cursor-pointer tabular-nums"
          >
            <ShoppingCart size={13} strokeWidth={2.5} />
            <span>
              {bulkCartSuccess ? "¡Añadidos al carrito!" : "Añadir al carrito"}
            </span>
          </button>

          <div className="h-4 w-px bg-[var(--border-color)] shrink-0" />

          {/* Cambiar categoría en lote con Menú Desplegable Glassmorphic */}
          <div className="shrink-0 flex items-center gap-2 whitespace-nowrap">
            <select
              value={bulkCategory}
              onChange={(e) =>
                setBulkCategory(e.target.value as ProductCategory)
              }
              aria-label="Seleccionar nueva categoría en lote"
              className="shrink-0 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent max-w-[145px] truncate cursor-pointer"
            >
              {catalogConfig.categoryOrder.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                >
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkCategoryChange}
              className="shrink-0 whitespace-nowrap rounded-xl border border-accent/40 bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-all duration-150 cursor-pointer active:scale-95"
            >
              Mover categoría
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-color)] shrink-0" />

          {/* Ajustar stock en lote */}
          <div className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleBulkStockDelta(-1)}
              className="shrink-0 whitespace-nowrap rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer active:scale-95 tabular-nums"
            >
              -1 Stock
            </button>
            <button
              type="button"
              onClick={() => handleBulkStockDelta(1)}
              className="shrink-0 whitespace-nowrap rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer active:scale-95 tabular-nums"
            >
              +1 Stock
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-color)] shrink-0" />

          {/* Eliminar seleccionados y limpiar */}
          <div className="shrink-0 flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Trash2 size={13} />
              <span>Eliminar</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              title="Limpiar selección"
              aria-label="Limpiar selección"
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent active:scale-95 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
