import { Archive, History, PieChart, ShoppingCart } from "lucide-react";

export type Tab = "summary" | "sell" | "inventory" | "history";
export type NavbarVariant = "floating" | "fixed";

interface NavbarProps {
  activeTab: Tab;
  cartCount: number;
  onTabChange: (tab: Tab) => void;
  variant?: NavbarVariant;
  isVisible?: boolean;
}

const tabs: Array<{ id: Tab; label: string; icon: typeof PieChart }> = [
  { id: "summary", label: "Resumen", icon: PieChart },
  { id: "sell", label: "Vender", icon: ShoppingCart },
  { id: "inventory", label: "Inventario", icon: Archive },
  { id: "history", label: "Historial", icon: History },
];

export default function Navbar({
  activeTab,
  cartCount,
  onTabChange,
  variant = "floating",
  isVisible = true,
}: NavbarProps) {
  const isFloating = variant === "floating";

  return (
    <nav
      aria-label="Navegación principal móvil"
      className={`liquid-glass-surface fixed z-40 select-none md:hidden transition-all duration-200 ease-out will-change-[transform,opacity] ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-8 pointer-events-none invisible"
      } ${
        isFloating
          ? "inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] mx-auto max-w-sm rounded-full border border-white/15 dark:border-white/10 bg-white/70 dark:bg-black/65 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 p-1.5"
          : "inset-x-0 bottom-0 w-full border-t border-white/15 dark:border-white/10 bg-white/70 dark:bg-black/65 backdrop-blur-2xl backdrop-saturate-150 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
    >
      <div
        className={`grid grid-cols-4 gap-1 ${
          isFloating ? "" : "mx-auto max-w-sm"
        }`}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 active:scale-95 transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-accent text-white shadow-md shadow-accent/25 dark:shadow-[0_4px_16px_var(--accent-ring)] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 font-semibold"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-colors duration-150"
              />
              <span className="text-[10px] leading-tight tracking-tight transition-colors duration-150">
                {label}
              </span>
              {id === "sell" && cartCount > 0 && (
                <span className="tabular-nums absolute -top-0.5 right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white/40 dark:ring-black/60">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
