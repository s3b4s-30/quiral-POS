import { ShoppingCart } from "lucide-react";

interface FloatingCartFABProps {
  cartCount: number;
  onClick: () => void;
  isVisible?: boolean;
}

export default function FloatingCartFAB({
  cartCount,
  onClick,
  isVisible = true,
}: FloatingCartFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir a vender"
      title="Punto de venta"
      className={`fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-40 md:hidden flex h-14 w-14 items-center justify-center rounded-full bg-gradient-accent text-white shadow-accent-glow hover:shadow-accent-glow-lg border border-white/30 dark:border-white/15 active:scale-95 transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent will-change-[transform,opacity] ${
        isVisible
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-90 pointer-events-none invisible"
      }`}
    >
      <ShoppingCart className="w-6 h-6" />
      {cartCount > 0 && (
        <span className="tabular-nums absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white border-2 border-white dark:border-black shadow-sm">
          {cartCount}
        </span>
      )}
    </button>
  );
}

