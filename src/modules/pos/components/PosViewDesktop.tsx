import { Search, SlidersHorizontal, X } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CategoryManagerModal from "../../../components/CategoryManagerModal";
import DesktopPosTicket from "../../../components/DesktopPosTicket";
import LottiePlayer, {
  EMPTY_BOX_ANIMATION,
} from "../../../components/LottiePlayer";
import PosProductCard from "../../../components/PosProductCard";
import { useInventory } from "../../../context/InventoryContext";
import { ProductCategory } from "../../../types/domain";
import { isSameCatalogText } from "../../../utils/catalogConfig";

export interface PosViewDesktopProps {
  onCheckoutStateChange?: (open: boolean) => void;
}

export default function PosViewDesktop({
  onCheckoutStateChange,
}: PosViewDesktopProps) {
  const { products, suppliers, cart, addToCart, loading, catalogConfig } =
    useInventory();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | ProductCategory>("Todos");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Referencia al input de búsqueda para atajo '/' o Ctrl+F en Desktop
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      // Atajo '/' cuando no se está escribiendo en otro input
      if (e.key === "/" && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Atajo Ctrl+F / Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleOpenCategoryModal = (open: boolean) => {
    setIsCategoryModalOpen(open);
    onCheckoutStateChange?.(open);
  };

  // Categorías ordenadas según catalogConfig.categoryOrder, con "Todos" fijo al inicio
  const categories = useMemo(() => {
    const ordered: ProductCategory[] = [...catalogConfig.categoryOrder];
    for (const product of products) {
      if (
        product.category &&
        !ordered.some((existing) =>
          isSameCatalogText(existing, product.category)
        )
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
        (category === "Todos" ||
          isSameCatalogText(product.category, category)) &&
        (!normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.subtitle?.toLowerCase().includes(normalizedQuery))
    );
  }, [products, query, category]);

  const handleAddToCart = useCallback(
    (productId: string) => {
      addToCart(productId);
    },
    [addToCart]
  );

  return (
    <div
      data-testid="desktop-pos-split-view"
      className="w-full h-full flex overflow-hidden bg-[var(--bg-primary)] antialiased-hd"
    >
      {/* Columna Izquierda: Catálogo y Búsqueda Rápida (~65% - 70%) */}
      <section className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[var(--bg-primary)]">
        {/* Header Superior del Catálogo en Desktop */}
        <div className="p-4 pb-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-md shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            {/* Buscador Rápido con atajo de teclado */}
            <div className="flex-1 flex min-h-11 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-150">
              <Search
                size={18}
                className="shrink-0 text-[var(--text-secondary)]"
              />
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
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)] bg-black/5 dark:bg-white/10 rounded border border-[var(--border-color)] select-none">
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

          {/* Píldoras de Categoría Horizontales para Mouse */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((item) => {
              const isActive = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none cursor-pointer ${
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
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
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
                No se encontraron productos para vender que coincidan con el
                filtro.
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="hover:-translate-y-0.5 transition-transform duration-150"
                >
                  <PosProductCard
                    product={product}
                    inCart={cartQuantities.get(product.id) ?? 0}
                    onAddToCart={handleAddToCart}
                    supplierColors={supplierColors}
                  />
                </div>
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
          onStartClose={() => handleOpenCategoryModal(false)}
          onClose={() => handleOpenCategoryModal(false)}
        />
      )}
    </div>
  );
}
