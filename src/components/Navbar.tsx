import { Archive, History, PieChart, ShoppingCart } from "lucide-react";

export type Tab = "summary" | "sell" | "inventory" | "history";
export type NavbarVariant = "floating" | "fixed";

interface NavbarProps {
  activeTab: Tab;
  cartCount: number;
  onTabChange: (tab: Tab) => void;
  variant?: NavbarVariant;
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
}: NavbarProps) {
  const isFloating = variant === "floating";

  return (
    <nav
      className={`fixed z-30 transition-colors duration-75 select-none md:hidden ${
        isFloating
          ? "liquid-glass-surface inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] mx-auto max-w-md rounded-3xl p-1.5"
          : "liquid-glass-surface inset-x-0 bottom-0 w-full border-t px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
    >
      <div className={`grid grid-cols-4 gap-1 ${isFloating ? "" : "mx-auto max-w-md"}`}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(id)}
              className={`relative flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-semibold transition-colors duration-200 active:scale-95 ${
                isActive
                  ? "bg-accent text-white shadow-sm dark:bg-[var(--bg-elevated)] dark:text-accent dark:border dark:border-accent/30 dark:shadow-md"
                  : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-colors duration-200" />
              <span className="text-[11px] leading-tight tracking-tight transition-colors duration-200">{label}</span>
              {id === "sell" && cartCount > 0 && (
                <span className="tabular-nums absolute -top-1 right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white/30 dark:ring-[var(--bg-elevated)]">
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
