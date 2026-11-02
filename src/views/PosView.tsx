import { Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import CartSummaryBar from "../components/CartSummaryBar";
import CheckoutSheet from "../components/CheckoutSheet";
import PosProductCard from "../components/PosProductCard";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";

interface PosViewProps {
  onCheckoutStateChange: (open: boolean) => void;
}

export default function PosView({ onCheckoutStateChange }: PosViewProps) {
  const { products, suppliers, cart, cartUnits, addToCart, loading } = useInventory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | ProductCategory>("Todos");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutClosing, setIsCheckoutClosing] = useState(false);

  const categories = useMemo(
    () => ["Todos", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const supplierColors = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.color])),
    [suppliers],
  );

  const cartQuantities = useMemo(
    () => new Map(cart.map((item) => [item.productId, item.quantity])),
    [cart],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        (category === "Todos" || product.category === category) &&
        (!normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.subtitle?.toLowerCase().includes(normalizedQuery)),
    );
  }, [products, query, category]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [cart],
  );

  const handleAddToCart = useCallback(
    (productId: string) => {
      addToCart(productId);
    },
    [addToCart],
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
    onCheckoutStateChange(false);
  };

  return (
    <>
      <div className="quiral-scroll-container" id="pos-scroll">
        <div className="mx-auto max-w-xl md:max-w-4xl lg:max-w-5xl px-4">
          {/* Header sticky con fondo sólido opaco nativo (Apple HIG) */}
          <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2.5 mb-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)] transition-colors duration-75">
            <div className="relative">
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 shadow-sm focus-within:border-[#007aff] transition-colors duration-75">
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

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((item) => {
                const isActive = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item as "Todos" | ProductCategory)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors duration-75 active:scale-95 ${
                      isActive
                        ? "bg-[#007aff] text-white shadow-sm"
                        : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
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
                    <div className="h-3 w-1/2 rounded bg-black/5 dark:bg-white/10" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <div className="h-6 w-24 rounded-lg bg-black/5 dark:bg-white/10" />
                    <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/10" />
                  </div>
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 sm:p-10 text-center shadow-sm select-none animate-in fade-in duration-150">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff] mb-3">
                  <Search size={26} />
                </div>
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
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#007aff] px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform"
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

      {/* Barra flotante sobre la barra inferior con resumen */}
      {(!isCheckoutOpen || isCheckoutClosing) && cartUnits > 0 && (
        <CartSummaryBar units={cartUnits} total={cartTotal} onCheckout={openCheckout} />
      )}

      {/* Modal CheckoutSheet de cobro limpio */}
      {isCheckoutOpen && (
        <CheckoutSheet
          onClose={closeCheckout}
          onStartClose={handleStartCloseCheckout}
        />
      )}
    </>
  );
}
