import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartSummaryBar from "../../../components/CartSummaryBar";
import CategoryManagerModal from "../../../components/CategoryManagerModal";
import CheckoutSheet from "../../../components/CheckoutSheet";
import HorizontalScrollNav from "../../../components/HorizontalScrollNav";
import LottiePlayer, {
  EMPTY_BOX_ANIMATION,
} from "../../../components/LottiePlayer";
import PosProductCard from "../../../components/PosProductCard";
import { useInventory } from "../../../context/InventoryContext";
import { ProductCategory } from "../../../types/domain";
import { isSameCatalogText } from "../../../utils/catalogConfig";
import { foldDiacritics } from "../../../utils/formatters";

export interface PosViewMobileProps {
  onCheckoutStateChange: (open: boolean) => void;
}

export default function PosViewMobile({
  onCheckoutStateChange,
}: PosViewMobileProps) {
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

  // Categorías ordenadas exclusivamente según catalogConfig.categoryOrder, con "Todos" fijo al inicio
  const categories = useMemo(() => {
    return ["Todos", ...catalogConfig.categoryOrder] as Array<
      "Todos" | ProductCategory
    >;
  }, [catalogConfig.categoryOrder]);

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
    const qFolded = foldDiacritics(query);
    return products.filter(
      (product) =>
        (category === "Todos" ||
          isSameCatalogText(product.category, category)) &&
        (!qFolded ||
          foldDiacritics(product.name).includes(qFolded) ||
          foldDiacritics(product.subtitle).includes(qFolded) ||
          foldDiacritics(product.category).includes(qFolded))
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

  return (
    <>
      <div className="quiral-scroll-container" id="pos-scroll">
        <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4">
          {/* Header sticky con fondo sólido opaco nativo (Apple HIG) */}
          <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2.5 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
            <div className="relative">
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm focus-within:border-accent transition-colors duration-200">
                <Search
                  size={18}
                  className="shrink-0 text-[var(--text-secondary)]"
                />
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

            <HorizontalScrollNav
              testId="pos-mobile-category-chips-nav"
              variant="none"
              enableDrag={true}
              className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1"
              containerClassName="mt-3 relative flex items-center w-full min-w-0"
              scrollAmount={200}
            >
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
            </HorizontalScrollNav>
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
                  No se encontraron productos para vender que coincidan con la
                  búsqueda o el filtro seleccionado.
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
      {(!isCheckoutOpen || isCheckoutClosing) &&
        !isCategoryModalOpen &&
        cartUnits > 0 && (
          <div className="md:hidden">
            <CartSummaryBar
              units={cartUnits}
              total={cartTotal}
              onCheckout={openCheckout}
            />
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
