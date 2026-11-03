import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartSummaryBar from "../components/CartSummaryBar";
import CategoryManagerModal from "../components/CategoryManagerModal";
import CheckoutSheet from "../components/CheckoutSheet";
import DesktopPosTicket from "../components/DesktopPosTicket";
import LottiePlayer, { EMPTY_BOX_ANIMATION } from "../components/LottiePlayer";
import PosProductCard from "../components/PosProductCard";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";
import { isSameCatalogText } from "../utils/catalogConfig";

interface PosViewProps {
  onCheckoutStateChange: (open: boolean) => void;
}

export default function PosView({ onCheckoutStateChange }: PosViewProps) {
  const {
    products,
    suppliers,
    cart,
    cartUnits,
    addToCart,
    loading,
    catalogConfig,
  } = useInventory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | ProductCategory>("Todos");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutClosing, setIsCheckoutClosing] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Detección reactiva de resolución desktop (>= 768px)
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

  // Referencia al input de búsqueda para atajo / o Ctrl+F en Desktop
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDesktopViewport) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      // Atajo '/' cuando no se está escribiendo en otro input
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Atajo Ctrl+F / Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isDesktopViewport]);

  // Gestor de Long-Press para píldoras de categorías en POS
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleOpenCategoryModal = (open: boolean) => {
    setIsCategoryModalOpen(open);
    onCheckoutStateChange(open || isCheckoutOpen);
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

  // Categorías ordenadas según catalogConfig.categoryOrder, con "Todos" fijo al inicio
  const categories = useMemo(() => {
    const ordered: ProductCategory[] = [...catalogConfig.categoryOrder];
    for (const product of products) {
      if (
        product.category &&
        !ordered.some((existing) => isSameCatalogText(existing, product.category))
      ) {
        ordered.push(product.category);
      }
    }
    return ["Todos", ...ordered] as Array<"Todos" | ProductCategory>;
  }, [products, catalogConfig.categoryOrder]);

  useEffect(() => {
    if (
      category !== "Todos" &&
      !categories.some((c) => isSameCatalogText(c, category))
    ) {
      setCategory("Todos");
    }
  }, [categories, category]);

  const supplierColors = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.color])),
    [suppliers]
  );

  const cartQuantities = useMemo(
    () => new Map(cart.map((item) => [item.productId, item.quantity])),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        (category === "Todos" || isSameCatalogText(product.category, category)) &&
        (!normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.subtitle?.toLowerCase().includes(normalizedQuery))
    );
  }, [products, query, category]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [cart]
  );

  const handleAddToCart = useCallback(
    (productId: string) => {
      addToCart(productId);
    },
    [addToCart]
  );

  const openCheckout = () => {
    setIsCheckoutClosing(false);
    setIsCheckoutOpen(true);
    onCheckoutStateChange(true);
  };

  const handleStartCloseCheckout = () => {
    setIsCheckoutClosing(true);
    onCheckoutStateChange(false);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setIsCheckoutClosing(false);
    onCheckoutStateChange(isCategoryModalOpen);
  };

  // -------------------------------------------------------------
  // EXPERIENCIA DE ESCRITORIO (>= 768px): POS SPLIT VIEW EN PANTALLA COMPLETA
  // -------------------------------------------------------------
  if (isDesktopViewport) {
    return (
      <div
        data-testid="desktop-pos-split-view"
        className="w-full h-full flex overflow-hidden pt-[var(--quiral-header-offset,4rem)]"
      >
        {/* Columna Izquierda: Catálogo y Búsqueda Rápida (~65% - 70%) */}
        <section className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[var(--bg-primary)]">
          {/* Header Superior del Catálogo en Desktop */}
          <div className="p-4 pb-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-md shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              {/* Buscador Rápido con atajo de teclado */}
              <div className="flex-1 flex min-h-11 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-150">
                <Search size={18} className="shrink-0 text-[var(--text-secondary)]" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar referencia, cargador, funda o accesorio... (Atajo '/')"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQuery("")}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)] bg-black/5 dark:bg-white/10 rounded border border-[var(--border-color)]">
                    /
                  </kbd>
                )}
              </div>

              {/* Botón de organizar categorías */}
              <button
                type="button"
                onClick={() => handleOpenCategoryModal(true)}
                aria-label="Organizar categorías"
                title="Organizar categorías"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-accent hover:border-accent active:scale-95 transition-all duration-150 shadow-xs"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Píldoras de Categoría Horizontales */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((item) => {
                const isActive = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none ${
                      isActive
                        ? "bg-accent text-white shadow-xs"
                        : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuadrícula de Productos con Scroll Vertical Independiente */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`pos-desktop-skeleton-${idx}`}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 shadow-sm animate-pulse flex flex-col justify-between h-36"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-20 rounded-full bg-black/5 dark:bg-white/10" />
                        <div className="h-4 w-12 rounded-full bg-black/5 dark:bg-white/10" />
                      </div>
                      <div className="h-5 w-3/4 rounded-lg bg-black/5 dark:bg-white/10" />
                      <div className="h-3 w-1/2 rounded-lg bg-black/5 dark:bg-white/10" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                      <div className="h-6 w-24 rounded-lg bg-black/5 dark:bg-white/10" />
                      <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-12 text-center shadow-xs select-none max-w-md mx-auto my-12 animate-in fade-in duration-150">
                <LottiePlayer
                  animationData={EMPTY_BOX_ANIMATION}
                  className="w-32 h-32 mx-auto mb-2"
                  loop={true}
                />
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  Sin productos disponibles
                </h4>
                <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                  No se encontraron productos para vender que coincidan con el filtro.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("Todos");
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all duration-150"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <PosProductCard
                    key={product.id}
                    product={product}
                    inCart={cartQuantities.get(product.id) ?? 0}
                    onAddToCart={handleAddToCart}
                    supplierColors={supplierColors}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Columna Derecha: Panel de Ticket de Venta y Cobro Directo (~30% - 35%) */}
        <DesktopPosTicket />

        {/* Modal de Gestión y Reordenamiento de Categorías */}
        {isCategoryModalOpen && (
          <CategoryManagerModal
            onStartClose={() => onCheckoutStateChange(false)}
            onClose={() => handleOpenCategoryModal(false)}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXPERIENCIA MÓVIL (< 768px): 100% INTACTA
  // -------------------------------------------------------------
  return (
    <>
      <div className="quiral-scroll-container" id="pos-scroll">
        <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4">
          {/* Header sticky con fondo sólido opaco nativo (Apple HIG) */}
          <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2.5 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
            <div className="relative">
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm focus-within:border-accent transition-colors duration-200">
                <Search size={18} className="shrink-0 text-[var(--text-secondary)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar productos para vender..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQuery("")}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((item) => {
                const isActive = category === item;
                return (
                  <button
                    key={item}
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
                      setCategory(item);
                    }}
                    title="Toca para filtrar · Mantén presionado para organizar categorías"
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 select-none ${
                      isActive
                        ? "bg-accent text-white shadow-sm"
                        : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

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
          </div>

          {/* Listado de tarjetas de productos en grilla adaptable con margen inferior anti-colisión */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
              cartUnits > 0 ? "pb-20 sm:pb-16" : "pb-6"
            }`}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`pos-skeleton-${idx}`}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 shadow-sm animate-pulse flex flex-col justify-between h-36"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 rounded-full bg-black/5 dark:bg-white/10" />
                      <div className="h-4 w-12 rounded-full bg-black/5 dark:bg-white/10" />
                    </div>
                    <div className="h-5 w-3/4 rounded-lg bg-black/5 dark:bg-white/10" />
                    <div className="h-3 w-1/2 rounded-lg bg-black/5 dark:bg-white/10" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <div className="h-6 w-24 rounded-lg bg-black/5 dark:bg-white/10" />
                    <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/10" />
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
                  Sin productos disponibles
                </h4>
                <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-sm mx-auto">
                  No se encontraron productos para vender que coincidan con la búsqueda o el filtro seleccionado.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("Todos");
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all duration-200"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <PosProductCard
                  key={product.id}
                  product={product}
                  inCart={cartQuantities.get(product.id) ?? 0}
                  onAddToCart={handleAddToCart}
                  supplierColors={supplierColors}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Barra flotante sobre la barra inferior con resumen (Solo móvil) */}
      {(!isCheckoutOpen || isCheckoutClosing) && !isCategoryModalOpen && cartUnits > 0 && (
        <div className="md:hidden">
          <CartSummaryBar units={cartUnits} total={cartTotal} onCheckout={openCheckout} />
        </div>
      )}

      {/* Modal CheckoutSheet de cobro limpio (Solo móvil) */}
      {isCheckoutOpen && (
        <CheckoutSheet
          onClose={closeCheckout}
          onStartClose={handleStartCloseCheckout}
        />
      )}

      {/* Modal de Gestión y Reordenamiento de Categorías (Long-Press) */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          onStartClose={() => onCheckoutStateChange(false)}
          onClose={() => handleOpenCategoryModal(false)}
        />
      )}
    </>
  );
}
