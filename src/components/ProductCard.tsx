import React from "react";
import { Product } from "../types/domain";
import { formatCOP } from "../utils/formatters";

export interface ProductCardProps {
  product: Product;
  mode?: "pos" | "inventory";
  inCart?: number;
  onAddToCart?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  supplierColors?: Map<string, string>;
  showCosts?: boolean;
  avgCost?: number;
  profitPerUnit?: number;
  className?: string;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  mode = "pos",
  inCart = 0,
  onAddToCart,
  onSelectProduct,
  supplierColors,
  showCosts = false,
  avgCost = 0,
  profitPerUnit = 0,
  className = "",
}: ProductCardProps) {
  const stock = product.batches.reduce((sum, batch) => sum + batch.stock, 0);
  const isAvailable = stock > 0;

  const handleClick = () => {
    if (mode === "pos") {
      if (isAvailable && onAddToCart) {
        onAddToCart(product.id);
      }
    } else if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <article
      role="button"
      tabIndex={isAvailable || mode === "inventory" ? 0 : -1}
      aria-label={
        mode === "pos"
          ? `Agregar ${product.name} al carrito`
          : `Ver detalle de ${product.name}`
      }
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 shadow-sm outline-none transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:ring-accent ${
        isAvailable || mode === "inventory"
          ? "cursor-pointer active:scale-[0.99] hover:border-accent/40"
          : "opacity-50 cursor-not-allowed"
      } ${className}`}
    >
      {/* 1. Fila Superior: Título completo + subtítulo a la izquierda, Precio a la derecha con escala responsive */}
      <div className="flex items-center justify-between min-w-0 gap-2">
        <div className="flex-1 min-w-0 pr-1">
          <h3 className="line-clamp-2 text-sm sm:text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-[var(--text-secondary)]">
              {product.subtitle}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 max-w-[55%]">
          <span className="tabular-nums text-sm sm:text-base md:text-lg font-extrabold text-[var(--text-primary)] leading-tight whitespace-nowrap">
            {formatCOP(product.price)}
          </span>
        </div>
      </div>

      {/* 2. Separador horizontal sutil con wrap protector ante cifras largas */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)] pt-2">
        {/* Footer Izquierda: Unidades y puntos de lote */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`tabular-nums text-xs font-bold ${
              stock > 0 ? "text-[#30d158]" : "text-[#ff3b30]"
            }`}
          >
            {stock} uds
          </span>
          <div className="flex items-center gap-1">
            {product.batches
              .filter((batch) => batch.stock > 0)
              .map((batch) => {
                const color = supplierColors?.get(batch.supplierId) ?? "#007aff";
                return (
                  <span
                    key={batch.id}
                    className="h-2 w-2 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: color }}
                  />
                );
              })}
          </div>
        </div>

        {/* Footer Derecha: Acción o métricas */}
        {mode === "pos" ? (
          <div className="shrink-0">
            {inCart > 0 ? (
              <span
                aria-label={`${inCart} unidades seleccionadas`}
                className="flex h-7 min-w-7 px-1.5 items-center justify-center rounded-full bg-accent text-xs font-bold leading-none text-white shadow-sm transition-colors duration-200"
              >
                {inCart}
              </span>
            ) : isAvailable ? (
              <span className="pointer-events-none rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-accent transition-colors duration-200">
                + Agregar
              </span>
            ) : (
              <span className="pointer-events-none rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                Agotado
              </span>
            )}
          </div>
        ) : showCosts ? (
          <div className="text-right text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0 ml-auto flex-wrap justify-end">
            <span className="text-[var(--text-secondary)]">Costo:</span>
            <span className="tabular-nums font-semibold text-[var(--text-primary)]">
              {formatCOP(avgCost)}
            </span>
            <span className="tabular-nums font-bold text-[#30d158]">
              +{formatCOP(profitPerUnit)}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
});

export default ProductCard;
