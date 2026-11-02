import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AdvancedFiltersModal, {
  AdvancedFilterValues,
  DEFAULT_ADVANCED_FILTERS,
} from "../components/AdvancedFiltersModal";
import CategoryManagerModal from "../components/CategoryManagerModal";
import LottiePlayer, { EMPTY_BOX_ANIMATION } from "../components/LottiePlayer";
import ProductCard from "../components/ProductCard";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";
import { isSameCatalogText } from "../utils/catalogConfig";
import { formatCOP, parseCOPInput } from "../utils/formatters";

interface InventoryViewProps {
  onOpenSuppliers: () => void;
  onFilterModalStateChange?: (isOpen: boolean) => void;
}

export default function InventoryView({
  onOpenSuppliers: _onOpenSuppliers,
  onFilterModalStateChange,
}: InventoryViewProps) {
  const {
    products,
    getSupplier,
    showCosts,
    setSelectedProduct,
    loading,
    catalogConfig,
  } = useInventory();

  // Filtros
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Todos" | ProductCategory>("Todos");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues>(
    DEFAULT_ADVANCED_FILTERS
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Gestor de Long-Press para píldoras de categorías (Estilo WhatsApp / iOS)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleOpenFilterModal = (open: boolean) => {
    setIsFilterModalOpen(open);
    onFilterModalStateChange?.(open || isCategoryModalOpen);
  };

  const handleOpenCategoryModal = (open: boolean) => {
    setIsCategoryModalOpen(open);
    onFilterModalStateChange?.(open || isFilterModalOpen);
  };

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
      const matchingKey = orderedList.find((c) => isSameCatalogText(c, p.category));
      if (matchingKey !== undefined) {
        stockMap[matchingKey] = (stockMap[matchingKey] || 0) + pStock;
      }
    });

    return {
      sortedCategories: ["Todos", ...orderedList] as Array<"Todos" | ProductCategory>,
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
    }
  }, [sortedCategories, selectedCategory]);

  // Listado filtrado de productos con combinación multifiltro
  const filteredProducts = useMemo(() => {
    const minP = parseCOPInput(advancedFilters.minPrice);
    const maxP = parseCOPInput(advancedFilters.maxPrice);
    const minW = parseInt(advancedFilters.minWarranty, 10) || 0;

    return products.filter((p) => {
      // Filtro de categoría
      const matchesCategory =
        selectedCategory === "Todos" || isSameCatalogText(p.category, selectedCategory);

      // Filtro de búsqueda por texto
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q));

      if (!matchesCategory || !matchesQuery) return false;

      const totalStock = p.batches.reduce((sum, b) => sum + b.stock, 0);

      // Filtro de Proveedor
      if (advancedFilters.supplierId) {
        const hasSupplier = p.batches.some(
          (b) => b.supplierId === advancedFilters.supplierId
        );
        if (!hasSupplier) return false;
      }

      // Filtro de Estado de Stock
      if (advancedFilters.stockStatus === "in_stock" && totalStock <= 0) return false;
      if (
        advancedFilters.stockStatus === "low_stock" &&
        (totalStock <= 0 || totalStock > 3)
      ) {
        return false;
      }
      if (advancedFilters.stockStatus === "out_of_stock" && totalStock > 0) return false;

      // Filtro de Rango de Precio
      if (minP > 0 && p.price < minP) return false;
      if (maxP > 0 && p.price > maxP) return false;

      // Filtro de Garantía mínima
      if (minW > 0 && p.warrantyDays < minW) return false;

      return true;
    });
  }, [products, selectedCategory, query, advancedFilters]);

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
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  };

  return (
    /* Contenedor Principal: scroll vertical nativo Apple HIG */
    <div id="inventory-scroll" className="quiral-scroll-container transition-colors duration-75">
      <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4">
        {/* 1. Buscador, Embudo Multifiltro y Categorías Fijas con Fondo Sólido Opaco */}
        <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2.5 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm transition-colors duration-75 focus-within:border-[#007aff]">
                <Search size={18} className="text-[var(--text-secondary)] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en catálogo..."
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

            {/* Botón Embudo Multifiltro */}
            <button
              type="button"
              onClick={() => handleOpenFilterModal(true)}
              aria-label="Filtros avanzados de inventario"
              title="Filtros avanzados"
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
                hasActiveAdvancedFilters
                  ? "border-[#007aff] bg-[#007aff]/10 text-[#007aff] shadow-sm"
                  : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Filter size={18} />
              {hasActiveAdvancedFilters && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#007aff] ring-2 ring-[var(--bg-elevated)]" />
              )}
            </button>
          </div>

          {/* 2. Chips Horizontales de Selección de Categoría (Soporte Long-Press para Organizar Categorías) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {sortedCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              const isZeroStock = cat !== "Todos" && (categoryStockMap[cat] || 0) === 0;
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
                  }}
                  title="Toca para filtrar · Mantén presionado para organizar categorías"
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-75 select-none ${
                    isActive
                      ? "bg-[#007aff] text-white shadow-sm"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[#007aff] hover:border-[#007aff] active:scale-95 transition-colors"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* 3. Resumen de Costos y Valor cuando Modo Costos está Activo */}
        {showCosts && (
          <section className="mb-4 overflow-hidden rounded-2xl border border-[#007aff]/30 bg-[#007aff]/5 p-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#007aff] dark:text-[#0a84ff]">
              <span>Auditoría de Costos y Valorización</span>
              <span className="rounded-full bg-[#007aff]/15 px-2 py-0.5 text-[10px] font-bold text-[#007aff] dark:text-[#0a84ff]">
                Activo
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">Stock Total</p>
                {loading ? (
                  <div className="mx-auto h-4 w-12 rounded bg-black/5 dark:bg-white/10 animate-pulse mt-1" />
                ) : (
                  <p className="text-xs min-[400px]:text-sm sm:text-base font-bold tabular-nums tracking-tight text-[var(--text-primary)] mt-0.5 truncate">
                    {inventoryStats.totalStock} uds
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">Inversión Costo</p>
                {loading ? (
                  <div className="mx-auto h-4 w-16 rounded bg-black/5 dark:bg-white/10 animate-pulse mt-1" />
                ) : (
                  <p className="text-xs min-[400px]:text-sm sm:text-base font-bold tabular-nums tracking-tight text-[#ff9500] mt-0.5 truncate">
                    {formatCOP(inventoryStats.totalCost)}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-2 border border-[var(--border-color)] min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">Utilidad Potencial</p>
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

        {/* 4. Listado de Tarjetas de Productos */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
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
                No se encontraron productos que coincidan con la búsqueda o los filtros activos.
              </p>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#007aff] px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const totalStock = product.batches.reduce((sum, b) => sum + b.stock, 0);

              const supplierColors = new Map(
                product.batches.map((b) => [b.supplierId, getSupplier(b.supplierId)?.color ?? "#007aff"])
              );

              const totalBatchCost = product.batches.reduce(
                (sum, b) => sum + b.cost * b.stock,
                0
              );
              const avgCost = totalStock > 0 ? Math.round(totalBatchCost / totalStock) : 0;
              const profitPerUnit = product.price - avgCost;

              return (
                <ProductCard
                  key={product.id}
                  mode="inventory"
                  product={product}
                  onSelectProduct={setSelectedProduct}
                  supplierColors={supplierColors}
                  showCosts={showCosts}
                  avgCost={avgCost}
                  profitPerUnit={profitPerUnit}
                />
              );
            })
          )}
        </section>
      </div>

      {/* Hoja Modal de Filtros Avanzados */}
      {isFilterModalOpen && (
        <AdvancedFiltersModal
          isOpen={isFilterModalOpen}
          onClose={() => handleOpenFilterModal(false)}
          filters={advancedFilters}
          onApply={(newFilters) => setAdvancedFilters(newFilters)}
          onReset={() => setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)}
        />
      )}

      {/* Hoja Modal de Gestión y Reordenamiento de Categorías (Long-Press) */}
      {isCategoryModalOpen && (
        <CategoryManagerModal onClose={() => handleOpenCategoryModal(false)} />
      )}
    </div>
  );
}
