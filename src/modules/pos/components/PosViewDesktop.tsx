import {
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CategoryManagerModal from "../../../components/CategoryManagerModal";
import DesktopPosTicket from "../../../components/DesktopPosTicket";
import HorizontalScrollNav from "../../../components/HorizontalScrollNav";
import LottiePlayer, {
  EMPTY_BOX_ANIMATION,
} from "../../../components/LottiePlayer";
import PosProductCard from "../../../components/PosProductCard";
import { useInventory } from "../../../context/InventoryContext";
import { ProductCategory } from "../../../types/domain";
import { isSameCatalogText } from "../../../utils/catalogConfig";
import { formatCOP } from "../../../utils/formatters";

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
  const [selectedAttributeTag, setSelectedAttributeTag] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [posViewMode, setPosViewMode] = useState<"table" | "cards">("table");

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

  const handleSelectCategory = (newCategory: "Todos" | ProductCategory) => {
    setCategory(newCategory);
    setSelectedAttributeTag("");
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
      setSelectedAttributeTag("");
    }
  }, [categories, category]);

  // Etiquetas dinámicas de atributos/subtipos disponibles cuando se filtra una categoría específica
  const availableAttributeTags = useMemo(() => {
    if (category === "Todos") return [];
    const tagSet = new Set<string>();
    for (const p of products) {
      if (!isSameCatalogText(p.category, category)) continue;
      if (!p.subtitle) continue;
      const parts = p.subtitle
        .split("·")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !isSameCatalogText(s, category));
      for (const part of parts) {
        tagSet.add(part);
      }
    }
    return Array.from(tagSet).slice(0, 15);
  }, [products, category]);

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
    const attrTagLower = selectedAttributeTag.trim().toLowerCase();
    return products.filter((product) => {
      // 1. Categoría principal
      if (
        category !== "Todos" &&
        !isSameCatalogText(product.category, category)
      ) {
        return false;
      }

      // 2. Subfiltro dinámico de atributos/subtipos
      if (selectedAttributeTag) {
        const sub = (product.subtitle || "").toLowerCase();
        const nm = product.name.toLowerCase();
        if (!sub.includes(attrTagLower) && !nm.includes(attrTagLower)) {
          return false;
        }
      }

      // 3. Búsqueda de texto
      if (
        normalizedQuery &&
        !product.name.toLowerCase().includes(normalizedQuery) &&
        !product.subtitle?.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      return true;
    });
  }, [products, query, category, selectedAttributeTag]);

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

            {/* Selector de Vista en POS: Tabla de Ventas (Predeterminada) o Tarjetas (3 cols) */}
            <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-1 shrink-0 select-none">
              <button
                type="button"
                data-testid="pos-view-table-btn"
                onClick={() => setPosViewMode("table")}
                title="Vista Tabla de Ventas (Predeterminada)"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                  posViewMode === "table"
                    ? "bg-accent text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Table2 size={14} />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                data-testid="pos-view-cards-btn"
                onClick={() => setPosViewMode("cards")}
                title="Vista Cuadrícula de Tarjetas (3 Columnas)"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                  posViewMode === "cards"
                    ? "bg-accent text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <LayoutGrid size={14} />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>

          {/* 1. Píldoras de Categoría Horizontales con Chevrons Laterales */}
          <HorizontalScrollNav
            testId="pos-desktop-category-chips-nav"
            className="flex items-center gap-2 overflow-x-auto scroll-smooth custom-scrollbar pb-1 flex-1"
            containerClassName="relative flex items-center w-full min-w-0"
            scrollAmount={240}
          >
            {categories.map((item) => {
              const isActive = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectCategory(item)}
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
          </HorizontalScrollNav>

          {/* 2. Subfiltros dinámicos de atributos/subtipos cuando hay una categoría activa */}
          {category !== "Todos" && availableAttributeTags.length > 0 && (
            <HorizontalScrollNav
              testId="pos-category-attribute-subfilters"
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar py-1"
              containerClassName="relative flex items-center w-full min-w-0 pt-1.5 border-t border-[var(--border-color)]/60"
              scrollAmount={200}
            >
              <button
                type="button"
                onClick={() => setSelectedAttributeTag("")}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                  selectedAttributeTag === ""
                    ? "bg-accent-subtle text-accent border border-accent/30"
                    : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Todos en {category}
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
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                      isTagActive
                        ? "bg-accent text-white shadow-xs"
                        : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </HorizontalScrollNav>
          )}
        </div>

        {/* Catálogo con Scroll Vertical Independiente: Tarjetas 3 Columnas o Tabla de Ventas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`pos-desktop-skeleton-${idx}`}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm animate-pulse flex flex-col justify-between h-36"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 rounded-full bg-black/5 dark:bg-white/10" />
                      <div className="h-4 w-16 rounded-full bg-black/5 dark:bg-white/10" />
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
                  setSelectedAttributeTag("");
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all duration-150"
              >
                Restablecer filtros
              </button>
            </div>
          ) : posViewMode === "cards" ? (
            /* Vista de Tarjetas: Estrictamente 3 Columnas en Desktop (priorizando visibilidad del nombre) */
            <div
              data-testid="pos-products-cards-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
            >
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
          ) : (
            /* Vista de Tabla de Ventas: Alta densidad, nombres 100% legibles y clic directo */
            <div
              data-testid="pos-products-table-view"
              className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-xs"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] font-extrabold uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-4">Artículo / Referencia</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3 text-right">Precio</th>
                    <th className="py-2.5 px-4 text-center w-32">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {filteredProducts.map((product) => {
                    const stock = product.batches.reduce(
                      (sum, b) => sum + b.stock,
                      0
                    );
                    const isAvailable = stock > 0;
                    const inCart = cartQuantities.get(product.id) ?? 0;
                    return (
                      <tr
                        key={product.id}
                        role="button"
                        tabIndex={isAvailable ? 0 : -1}
                        aria-label={`Agregar ${product.name} al carrito`}
                        onClick={() =>
                          isAvailable && handleAddToCart(product.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (isAvailable) handleAddToCart(product.id);
                          }
                        }}
                        className={`group transition-colors duration-100 ${
                          isAvailable
                            ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-accent-subtle/20"
                            : "opacity-40 cursor-not-allowed"
                        }`}
                      >
                        {/* Nombre y Subtítulo / Marca */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1 shrink-0">
                              {product.batches
                                .filter((b) => b.stock > 0)
                                .map((b) => (
                                  <span
                                    key={b.id}
                                    className="h-2 w-2 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                                    style={{
                                      backgroundColor:
                                        supplierColors.get(b.supplierId) ??
                                        "#a855f7",
                                    }}
                                  />
                                ))}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors block text-xs sm:text-sm">
                                {product.name}
                              </span>
                              {product.subtitle && (
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium block">
                                  {product.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                            {product.category}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`tabular-nums font-black text-xs sm:text-sm ${
                              stock > 0 ? "text-[#30d158]" : "text-[#ff3b30]"
                            }`}
                          >
                            {stock} uds
                          </span>
                        </td>

                        {/* Precio */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="tabular-nums font-black text-xs sm:text-sm text-[var(--text-primary)]">
                            {formatCOP(product.price)}
                          </span>
                        </td>

                        {/* Acción rápida */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {inCart > 0 ? (
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2.5 text-xs font-black text-white shadow-xs">
                              {inCart} en ticket
                            </span>
                          ) : isAvailable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-accent-subtle px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white active:scale-95 transition-all shadow-2xs cursor-pointer"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                              <span>Agregar</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-[var(--text-secondary)]">
                              Agotado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Columna Derecha: Panel de Ticket de Venta y Cobro Directo (~30% - 35%) */}
      <DesktopPosTicket />

      {/* Banco Maestro de Gestión y Reordenamiento de Categorías */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          initialCategory={category !== "Todos" ? category : undefined}
          onStartClose={() => handleOpenCategoryModal(false)}
          onClose={() => handleOpenCategoryModal(false)}
        />
      )}
    </div>
  );
}
