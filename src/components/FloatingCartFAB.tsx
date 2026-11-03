import { ShoppingCart } from "lucide-react";

interface FloatingCartFABProps {
  cartCount: number;
  onClick: () => void;
}

export default function FloatingCartFAB({ cartCount, onClick }: FloatingCartFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir a vender"
      title="Punto de venta"
      className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-40 md:hidden flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 border border-white/20 active:scale-95 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

