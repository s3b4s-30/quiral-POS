import {
  ChevronDown,
  Eye,
  EyeOff,
  Filter,
  LayoutGrid,
  Search,
  Sliders,
  SlidersHorizontal,
  Table2,
  X,
  Zap,
} from "lucide-react";
import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AdvancedFiltersModal,
  type AdvancedFilterValues,
  type InventoryPageSize,
  DEFAULT_ADVANCED_FILTERS,
  AttributeConfigModal,
  CategoryManagerModal,
  DesktopAttributeConfigView,
  DesktopInventoryGrid,
  DesktopProductDrawer,
  ProductCard,
} from "../modules/inventory";
import LottiePlayer, { EMPTY_BOX_ANIMATION } from "../components/LottiePlayer";
import { useInventory } from "../context/InventoryContext";
import { Product, ProductCategory } from "../types/domain";
import { isSameCatalogText } from "../utils/catalogConfig";
import { formatCOP, parseCOPInput } from "../utils/formatters";
import { useIsDesktop } from "../hooks/useIsDesktop";

interface InventoryViewProps {
  onOpenSuppliers: () => void;
  onFilterModalStateChange?: (isOpen: boolean) => void;
}

const DESKTOP_PAGE_SIZES: Array<{ value: InventoryPageSize; label: string }> = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: "all", label: "Todos" },
];

export default function InventoryView({
  onOpenSuppliers: _onOpenSuppliers,
  onFilterModalStateChange,
}: InventoryViewProps) {
  const {
    products,
    getSupplier,
    showCosts,
    setShowCosts,
    setSelectedProduct,
    loading,
    catalogConfig,
  } = useInventory();

  // Filtros y búsqueda diferida sin bloqueo del hilo principal (60fps en iPhone)
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedCategory, setSelectedCategory] = useState<
    "Todos" | ProductCategory
  >("Todos");
  const [selectedAttributeTag, setSelectedAttributeTag] = useState<string>("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues>(
    DEFAULT_ADVANCED_FILTERS
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);

  // Estados exclusivos de la Estación de Trabajo de Escritorio (Data Grid / Excel)
  const isDesktopViewport = useIsDesktop();
  const [desktopViewMode, setDesktopViewMode] = useState<"table" | "cards">(
    "table"
  );
  const [quickCountMode, setQuickCountMode] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(
    null
  );
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set()
  );

  const handleToggleCardSelect = (id: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const focusQuickAddRef = useRef<(() => void) | null>(null);

  // Paginación controlada: por defecto estrictamente 10 productos para carga instantánea en móvil (iPhone)
  const [pageSize, setPageSize] = useState<InventoryPageSize>(10);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Gestor de Long-Press para píldoras de categorías (Estilo WhatsApp / iOS)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleOpenFilterModal = (open: boolean) => {
    setIsFilterModalOpen(open);
    onFilterModalStateChange?.(
      open || isCategoryModalOpen || isAttributeModalOpen
    );
  };

  const handleOpenCategoryModal = (open: boolean) => {
    setIsCategoryModalOpen(open);
    onFilterModalStateChange?.(
      open || isFilterModalOpen || isAttributeModalOpen
    );
  };

  const [isDesktopAttributeView, setIsDesktopAttributeView] = useState(false);

  const handleOpenAttributeModal = (open: boolean) => {
    if (open && isDesktopViewport) {
      setIsDesktopAttributeView(true);
      return;
    }
    setIsAttributeModalOpen(open);
    onFilterModalStateChange?.(
      open || isFilterModalOpen || isCategoryModalOpen
    );
  };

  // Atajos Globales de Teclado en Escritorio (Ctrl+F / '/', Ctrl+N, Alt+M)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth < 768) return;
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Ctrl + F o '/' para enfocar el buscador principal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (
        e.key === "/" &&
        !isInputFocused &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Ctrl + N o Alt + N para enfocar la fila de Creación Rápida en Línea
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setDesktopViewMode("table");
        requestAnimationFrame(() => {
          focusQuickAddRef.current?.();
        });
        return;
      }

      // Alt + M para alternar el Modo Conteo Rápido tipo Excel
      if (e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setDesktopViewMode("table");
        setQuickCountMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCategoryPressStart = () => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      handleOpenCategoryModal(true);
    }, 420);
  };

  const handleCategoryPressEnd = () => {
    clearLongPressTimer();
  };

  useEffect(() => {
    return () => clearLongPressTimer();
  }, []);

  const hasActiveAdvancedFilters = useMemo(() => {
    return (
      advancedFilters.supplierId !== "" ||
      advancedFilters.stockStatus !== "all" ||
      advancedFilters.minPrice !== "" ||
      advancedFilters.maxPrice !== "" ||
      advancedFilters.minWarranty !== ""
    );
  }, [advancedFilters]);

  // Ordenar dinámicamente la barra de categorías según el orden personalizado en catalogConfig
  const { sortedCategories, categoryStockMap } = useMemo(() => {
    const orderedList: ProductCategory[] = [...catalogConfig.categoryOrder];

    products.forEach((p) => {
      if (
        p.category &&
        !orderedList.some((existing) => isSameCatalogText(existing, p.category))
      ) {
        orderedList.push(p.category);
      }
    });

    const stockMap: Record<string, number> = {};
    for (const cat of orderedList) {
      stockMap[cat] = 0;
    }

    products.forEach((p) => {
      const pStock = p.batches.reduce((sum, b) => sum + b.stock, 0);
      const matchingKey = orderedList.find((c) =>
        isSameCatalogText(c, p.category)
      );
      if (matchingKey !== undefined) {
        stockMap[matchingKey] = (stockMap[matchingKey] || 0) + pStock;
      }
    });

    return {
      sortedCategories: ["Todos", ...orderedList] as Array<
        "Todos" | ProductCategory
      >,
      categoryStockMap: stockMap,
    };
  }, [products, catalogConfig.categoryOrder]);

  // Si la categoría activa fue eliminada, volver a "Todos"
  useEffect(() => {
    if (
      selectedCategory !== "Todos" &&
      !sortedCategories.some((c) => isSameCatalogText(c, selectedCategory))
    ) {
      setSelectedCategory("Todos");
      setSelectedAttributeTag("");
    }
  }, [sortedCategories, selectedCategory]);

  // Índice precalculado en memoria para búsquedas instantáneas por nombre, categoría y atributos
  const productSearchIndex = useMemo(() => {
    const indexMap = new Map<string, string>();
    for (const p of products) {
      const searchableBlob =
        `${p.name} ${p.category} ${p.subtitle || ""}`.toLowerCase();
      indexMap.set(p.id, searchableBlob);
    }
    return indexMap;
  }, [products]);

  // Etiquetas dinámicas de atributos/subtipos disponibles cuando se filtra una categoría específica
  const availableAttributeTags = useMemo(() => {
    if (selectedCategory === "Todos") return [];
    const tagSet = new Set<string>();
    for (const p of products) {
      if (!isSameCatalogText(p.category, selectedCategory)) continue;
      if (!p.subtitle) continue;
      const parts = p.subtitle
        .split("·")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !isSameCatalogText(s, selectedCategory));
      for (const part of parts) {
        tagSet.add(part);
      }
    }
    return Array.from(tagSet).slice(0, 12);
  }, [products, selectedCategory]);

  // Reiniciar paginación al primer bloque cuando cambian filtros, búsqueda, categoría o límite por vista
  useEffect(() => {
    if (pageSize === "all") {
      setVisibleCount(products.length || 100);
    } else {
      setVisibleCount(pageSize);
    }
  }, [
    selectedCategory,
    selectedAttributeTag,
    deferredQuery,
    advancedFilters,
    pageSize,
    products.length,
  ]);

  // Listado filtrado de productos con combinación multifiltro e índice de atributos
  const filteredProducts = useMemo(() => {
    const minP = parseCOPInput(advancedFilters.minPrice);
    const maxP = parseCOPInput(advancedFilters.maxPrice);
    const minW = parseInt(advancedFilters.minWarranty, 10) || 0;
    const qTerms = deferredQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const attrTagLower = selectedAttributeTag.trim().toLowerCase();

    return products.filter((p) => {
      // 1. Filtro de categoría
      const matchesCategory =
        selectedCategory === "Todos" ||
        isSameCatalogText(p.category, selectedCategory);
      if (!matchesCategory) return false;

      // 2. Filtro rápido por etiqueta de atributo / subtipo de la categoría activa
      if (attrTagLower) {
        const sub = (p.subtitle || "").toLowerCase();
        const nm = p.name.toLowerCase();
        if (!sub.includes(attrTagLower) && !nm.includes(attrTagLower)) {
          return false;
        }
      }

      // 3. Filtro de búsqueda multi-término indexada (nombre, categoría y atributos)
      if (qTerms.length > 0) {
        const blob = productSearchIndex.get(p.id) || "";
        for (const term of qTerms) {
          if (!blob.includes(term)) return false;
        }
      }

      const totalStock = p.batches.reduce((sum, b) => sum + b.stock, 0);

      // 4. Filtro de Proveedor
      if (advancedFilters.supplierId) {
        const hasSupplier = p.batches.some(
          (b) => b.supplierId === advancedFilters.supplierId
        );
        if (!hasSupplier) return false;
      }

      // 5. Filtro de Estado de Stock
      if (advancedFilters.stockStatus === "in_stock" && totalStock <= 0)
        return false;
      if (
        advancedFilters.stockStatus === "low_stock" &&
        (totalStock <= 0 || totalStock > 3)
      ) {
        return false;
      }
      if (advancedFilters.stockStatus === "out_of_stock" && totalStock > 0)
        return false;

      // 6. Filtro de Rango de Precio
      if (minP > 0 && p.price < minP) return false;
      if (maxP > 0 && p.price > maxP) return false;

      // 7. Filtro de Garantía mínima
      if (minW > 0 && p.warrantyDays < minW) return false;

      return true;
    });
  }, [
    products,
    selectedCategory,
    selectedAttributeTag,
    deferredQuery,
    advancedFilters,
    productSearchIndex,
  ]);

  // Subconjunto visible según la paginación activa
  const paginatedProducts = useMemo(() => {
    if (pageSize === "all") return filteredProducts;
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, pageSize, visibleCount]);

  const remainingProductsCount = Math.max(
    0,
    filteredProducts.length - paginatedProducts.length
  );

  const nextIncrementCount =
    pageSize === "all"
      ? remainingProductsCount
      : Math.min(pageSize, remainingProductsCount);

  const handleLoadMore = () => {
    if (pageSize === "all") return;
    setVisibleCount((prev) =>
      Math.min(filteredProducts.length, prev + pageSize)
    );
  };

  const handleSelectPageSize = (nextSize: InventoryPageSize) => {
    setPageSize(nextSize);
    if (nextSize === "all") {
      setVisibleCount(filteredProducts.length);
    } else {
      setVisibleCount(nextSize);
    }
  };

  // Métricas financieras del inventario cuando Modo Costos está activo
  const inventoryStats = useMemo(() => {
    let totalStock = 0;
    let totalInventoryCost = 0;
    let totalPotentialRevenue = 0;

    for (const p of products) {
      for (const b of p.batches) {
        totalStock += b.stock;
        totalInventoryCost += b.cost * b.stock;
        totalPotentialRevenue += p.price * b.stock;
      }
    }

    return {
      totalStock,
      totalCost: totalInventoryCost,
      potentialRevenue: totalPotentialRevenue,
      potentialProfit: totalPotentialRevenue - totalInventoryCost,
    };
  }, [products]);

  const handleResetAllFilters = () => {
    setQuery("");
    setSelectedCategory("Todos");
    setSelectedAttributeTag("");
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  };

  if (isDesktopViewport && isDesktopAttributeView) {
    return (
      <DesktopAttributeConfigView
        activeCategory={
          selectedCategory !== "Todos" ? selectedCategory : undefined
        }
        onBack={() => setIsDesktopAttributeView(false)}
      />
    );
  }

  return (
    /* Contenedor Principal: scroll vertical nativo Apple HIG en móvil o estación completa en desktop */
    <div
      id="inventory-scroll"
      className={`${isDesktopViewport ? "w-full h-full overflow-y-auto" : "quiral-scroll-container"} transition-colors duration-75`}
    >
      <div
        className={
          isDesktopViewport
            ? "w-full px-6 lg:px-8 py-4 space-y-4 animate-in fade-in duration-200"
            : "mx-auto max-w-xl md:max-w-6xl lg:max-w-7xl px-4"
        }
      >
        {/* 1. Buscador Instantáneo, Embudo Multifiltro y Categorías Modulares Fijas */}
        <div
          className={`sticky top-0 z-20 ${isDesktopViewport ? "-mx-6 lg:-mx-8 px-6 lg:px-8" : "-mx-4 px-4"} pt-1 pb-2.5 mb-3 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="relative flex-1">
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm transition-colors duration-200 focus-within:border-accent">
                <Search
                  size={18}
                  className="text-[var(--text-secondary)] shrink-0"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, categoría o atributo..."
                  aria-label="Buscar en catálogo"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] transition-colors duration-200"
                />
                {!query && (
                  <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-secondary)] select-none">
                    / · Ctrl+F
                  </kbd>
                )}
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

            {/* Botón Embudo Multifiltro */}
            <button
              type="button"
              data-testid="open-advanced-filters-btn"
              onClick={() => handleOpenFilterModal(true)}
              aria-label="Filtros avanzados de inventario"
              title="Filtros avanzados"
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95 ${
                hasActiveAdvancedFilters
                  ? "border-accent bg-accent-subtle text-accent shadow-sm"
                  : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Filter size={18} />
              {hasActiveAdvancedFilters && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-[var(--bg-elevated)]" />
              )}
            </button>
          </div>

          {/* Barra de Herramientas de Alta Productividad (Exclusiva Escritorio >= 768px) */}
          <div
            data-testid="desktop-workstation-toolbar"
            className="hidden md:flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[var(--border-color)]/60"
          >
            {/* Izquierda: Contador en vivo + Controles de Conteo Rápido, Privacidad, Categorías y Atributos */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                data-testid="desktop-results-counter"
                className="tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-secondary)]"
              >
                Mostrando{" "}
                <strong className="text-[var(--text-primary)]">
                  {paginatedProducts.length}
                </strong>{" "}
                de{" "}
                <strong className="text-[var(--text-primary)]">
                  {filteredProducts.length}
                </strong>
              </span>

              {/* Switch Modo Conteo Rápido (Alt + M) */}
              <button
                type="button"
                data-testid="desktop-quick-count-btn"
                onClick={() => {
                  setDesktopViewMode("table");
                  setQuickCountMode((prev) => !prev);
                }}
                title="Alternar Modo Conteo Rápido tipo Excel (Alt + M)"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                  quickCountMode
                    ? "border-accent bg-accent text-white shadow-sm"
                    : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-accent/40"
                }`}
              >
                <Zap
                  size={14}
                  className={quickCountMode ? "fill-white/20" : "text-accent"}
                />
                <span>Modo Conteo Rápido</span>
                <kbd
                  className={`rounded px-1 py-0.5 text-[10px] font-extrabold ${
                    quickCountMode
                      ? "bg-white/20 text-white"
                      : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }`}
                >
                  Alt+M
                </kbd>
              </button>

              {/* Switch Privacidad / Costos (Ojo Abierto / Tachado) */}
              <button
                type="button"
                data-testid="desktop-toggle-costs-btn"
                onClick={() => setShowCosts((prev) => !prev)}
                title={
                  showCosts
                    ? "Ocultar costos y márgenes (Modo Privacidad)"
                    : "Revelar costos por mayor y márgenes"
                }
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                  showCosts
                    ? "border-accent/40 bg-accent-subtle text-accent"
                    : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {showCosts ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{showCosts ? "Costos visibles" : "Costos ocultos"}</span>
              </button>

              {/* Gestión de Categorías y Atributos */}
              <button
                type="button"
                onClick={() => handleOpenCategoryModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent/40 transition-colors duration-150"
              >
                <SlidersHorizontal size={13} className="text-accent" />
                <span>Categorías</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAttributeModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent/40 transition-colors duration-150"
              >
                <Sliders size={13} className="text-accent" />
                <span>Atributos</span>
              </button>
            </div>

            {/* Derecha: Paginación Densa en Escritorio + Selector de Vista (Tabla Excel / Tarjetas) */}
            <div className="flex items-center gap-2">
              <div
                data-testid="desktop-page-size-bar"
                className="flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-1"
              >
                {DESKTOP_PAGE_SIZES.map((item) => {
                  const active = pageSize === item.value;
                  return (
                    <button
                      key={String(item.value)}
                      type="button"
                      onClick={() => handleSelectPageSize(item.value)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold tabular-nums transition-colors duration-150 ${
                        active
                          ? "bg-accent text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-1">
                <button
                  type="button"
                  data-testid="desktop-view-table-btn"
                  onClick={() => setDesktopViewMode("table")}
                  title="Vista Hoja de Cálculo / Excel (Predeterminada)"
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors duration-150 ${
                    desktopViewMode === "table"
                      ? "bg-accent text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Table2 size={13} />
                  <span>Tabla Excel</span>
                </button>
                <button
                  type="button"
                  data-testid="desktop-view-cards-btn"
                  onClick={() => setDesktopViewMode("cards")}
                  title="Vista Cuadrícula de Tarjetas"
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors duration-150 ${
                    desktopViewMode === "cards"
                      ? "bg-accent text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Tarjetas</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Chips Horizontales de Selección de Categoría (Soporte Long-Press para Organizar Categorías) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {sortedCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              const isZeroStock =
                cat !== "Todos" && (categoryStockMap[cat] || 0) === 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onPointerDown={handleCategoryPressStart}
                  onPointerUp={handleCategoryPressEnd}
                  onPointerLeave={handleCategoryPressEnd}
                  onPointerCancel={handleCategoryPressEnd}
                  onTouchMove={handleCategoryPressEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    clearLongPressTimer();
                    handleOpenCategoryModal(true);
                  }}
                  onClick={() => {
                    if (longPressTriggeredRef.current) {
                      longPressTriggeredRef.current = false;
                      return;
                    }
                    setSelectedCategory(cat);
                    setSelectedAttributeTag("");
                  }}
                  title="Toca para filtrar · Mantén presionado para organizar categorías"
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 select-none ${
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
                  } ${isZeroStock && !isActive ? "opacity-60" : ""}`}
                >
                  {cat}
                </button>
              );
            })}

            {/* Acceso directo accesible para organizar categorías */}
            <button
              type="button"
              onClick={() => handleOpenCategoryModal(true)}
              aria-label="Organizar categorías"
              title="Organizar categorías (o mantén presionada una categoría)"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-accent hover:border-accent active:scale-95 transition-colors duration-200"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Subfiltros rápidos de atributos/subtipos cuando hay una categoría activa */}
          {selectedCategory !== "Todos" &&
            availableAttributeTags.length > 0 && (
              <div
                data-testid="category-attribute-subfilters"
                className="mt-2 flex items-center gap-1.5 overflow-x-auto pt-1.5 border-t border-[var(--border-color)]/60 no-scrollbar"
              >
                <button
                  type="button"
                  onClick={() => setSelectedAttributeTag("")}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 ${
                    selectedAttributeTag === ""
                      ? "bg-accent-subtle text-accent border border-accent/30"
                      : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  Todos en {selectedCategory}
                </button>
                {availableAttributeTags.map((tag) => {
                  const isTagActive = isSameCatalogText(
                    selectedAttributeTag,
                    tag
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedAttributeTag(isTagActive ? "" : tag)
                      }
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 ${
                        isTagActive
                          ? "bg-accent text-white shadow-sm"
                          : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
        </div>

        {/* Resumen de Costos y Valor cuando Modo Costos está Activo */}
        {showCosts && (
          <section className="mb-4 overflow-hidden rounded-2xl border border-accent/30 bg-accent-subtle p-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-accent">
              <span>Auditoría de Costos y Valorización</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                Activo
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                  Stock Total
                </p>
                {loading ? (
                  <div className="mx-auto h-4 w-12 rounded bg-black/5 dark:bg-white/10 animate-pulse mt-1" />
                ) : (
                  <p className="text-xs min-[400px]:text-sm sm:text-base font-bold tabular-nums tracking-tight text-[var(--text-primary)] mt-0.5 truncate">
                    {inventoryStats.totalStock} uds
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                  Inversión Costo
                </p>
                {loading ? (
                  <div className="mx-auto h-4 w-16 rounded bg-black/5 dark:bg-white/10 animate-pulse mt-1" />
                ) : (
                  <p className="text-xs min-[400px]:text-sm sm:text-base font-bold tabular-nums tracking-tight text-[#ff9500] mt-0.5 truncate">
                    {formatCOP(inventoryStats.totalCost)}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                  Utilidad Potencial
                </p>
                {loading ? (
                  <div className="mx-auto h-4 w-16 rounded bg-black/5 dark:bg-white/10 animate-pulse mt-1" />
                ) : (
                  <p className="text-xs min-[400px]:text-sm sm:text-base font-bold tabular-nums tracking-tight text-[#30d158] mt-0.5 truncate">
                    +{formatCOP(inventoryStats.potentialProfit)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 5. Contenido Principal: Vista Tabla Excel en Escritorio (>= 768px) o Tarjetas en Móvil (< 768px) */}
        <div className="pb-6 space-y-4">
          {isDesktopViewport &&
          !loading &&
          filteredProducts.length > 0 &&
          desktopViewMode === "table" ? (
            <DesktopInventoryGrid
              products={paginatedProducts}
              onInspectProduct={(prod) => setInspectedProduct(prod)}
              quickCountMode={quickCountMode}
              focusQuickAddRef={focusQuickAddRef}
            />
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`inv-skeleton-${idx}`}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-pulse flex flex-col justify-between h-40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 rounded-full bg-black/5 dark:bg-white/10" />
                        <div className="h-5 w-16 rounded-full bg-black/5 dark:bg-white/10" />
                      </div>
                      <div className="h-5 w-4/5 rounded-lg bg-black/5 dark:bg-white/10" />
                      <div className="h-3 w-1/3 rounded bg-black/5 dark:bg-white/10" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                      <div className="h-6 w-28 rounded-lg bg-black/5 dark:bg-white/10" />
                      <div className="h-7 w-20 rounded-xl bg-black/5 dark:bg-white/10" />
                    </div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 sm:p-10 text-center shadow-sm select-none animate-in fade-in duration-150">
                  <LottiePlayer
                    animationData={EMPTY_BOX_ANIMATION}
                    className="w-32 h-32 mx-auto mb-2"
                    loop={true}
                  />
                  <h4 className="text-base font-bold text-[var(--text-primary)]">
                    Catálogo sin resultados
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-sm mx-auto">
                    No se encontraron productos que coincidan con la búsqueda o
                    los filtros activos.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all duration-200"
                  >
                    Restablecer todos los filtros
                  </button>
                </div>
              ) : (
                paginatedProducts.map((product) => {
                  const totalStock = product.batches.reduce(
                    (sum, b) => sum + b.stock,
                    0
                  );

                  const supplierColors = new Map(
                    product.batches.map((b) => [
                      b.supplierId,
                      getSupplier(b.supplierId)?.color ?? "#007aff",
                    ])
                  );

                  const totalBatchCost = product.batches.reduce(
                    (sum, b) => sum + b.cost * b.stock,
                    0
                  );
                  const avgCost =
                    totalStock > 0
                      ? Math.round(totalBatchCost / totalStock)
                      : 0;
                  const profitPerUnit = product.price - avgCost;

                  return (
                    <ProductCard
                      key={product.id}
                      mode="inventory"
                      product={product}
                      onSelectProduct={setSelectedProduct}
                      onToggleSelect={handleToggleCardSelect}
                      isSelected={selectedCardIds.has(product.id)}
                      supplierColors={supplierColors}
                      showCosts={showCosts}
                      avgCost={avgCost}
                      profitPerUnit={profitPerUnit}
                    />
                  );
                })
              )}
            </section>
          )}

          {/* Botón "Ver más productos" cuando existen más elementos por cargar */}
          {!loading && remainingProductsCount > 0 && pageSize !== "all" && (
            <div className="flex flex-col items-center justify-center pt-2">
              <button
                type="button"
                data-testid="load-more-products-btn"
                aria-label={`Ver ${nextIncrementCount} productos más`}
                onClick={handleLoadMore}
                className="flex min-h-12 w-full sm:w-auto sm:min-w-[260px] items-center justify-center gap-2 rounded-2xl border border-accent/35 bg-accent-subtle px-5 py-3 text-sm font-bold text-accent shadow-sm transition-all duration-200 hover:bg-accent hover:text-white active:scale-[0.98]"
              >
                <ChevronDown size={18} strokeWidth={2.5} className="shrink-0" />
                <span>
                  {nextIncrementCount === 1
                    ? "Ver 1 producto más"
                    : `Ver ${nextIncrementCount} productos más`}
                </span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-extrabold tabular-nums">
                  Restan {remainingProductsCount}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel Lateral de Inspección y Edición Completa en Escritorio (Desktop Side Drawer) */}
      {inspectedProduct && (
        <DesktopProductDrawer
          product={inspectedProduct}
          onClose={() => setInspectedProduct(null)}
          onOpenAttributeModal={(cat) => {
            setSelectedCategory(cat);
            handleOpenAttributeModal(true);
          }}
        />
      )}

      {/* Hoja Modal de Filtros Avanzados */}
      {isFilterModalOpen && (
        <AdvancedFiltersModal
          isOpen={isFilterModalOpen}
          onStartClose={() => onFilterModalStateChange?.(false)}
          onClose={() => handleOpenFilterModal(false)}
          filters={advancedFilters}
          onApply={(newFilters) => setAdvancedFilters(newFilters)}
          onReset={() => {
            setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
            handleSelectPageSize(10);
          }}
          pageSize={pageSize}
          onPageSizeChange={handleSelectPageSize}
        />
      )}

      {/* Hoja Modal de Gestión y Reordenamiento de Categorías (Long-Press) */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          onStartClose={() => onFilterModalStateChange?.(false)}
          onClose={() => handleOpenCategoryModal(false)}
        />
      )}

      {/* Hoja Modal del Banco Maestro de Atributos */}
      {isAttributeModalOpen && (
        <AttributeConfigModal
          activeCategory={
            selectedCategory !== "Todos" ? selectedCategory : undefined
          }
          onClose={() => handleOpenAttributeModal(false)}
        />
      )}
    </div>
  );
}
