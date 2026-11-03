import {
  Archive,
  Eye,
  EyeOff,
  History,
  LogOut,
  Moon,
  PieChart,
  ShieldCheck,
  ShoppingCart,
  Store,
  Sun,
  SunMoon,
  Users,
} from "lucide-react";
import React from "react";
import { useInventory } from "../context/InventoryContext";
import { Tab } from "./Navbar";
import { Theme } from "./TopMenu";

interface DesktopSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount: number;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenSuppliers: () => void;
  onOpenProfile?: () => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: typeof PieChart }> = [
  { id: "summary", label: "Resumen", icon: PieChart },
  { id: "sell", label: "Vender", icon: ShoppingCart },
  { id: "inventory", label: "Inventario", icon: Archive },
  { id: "history", label: "Historial", icon: History },
];

export default function DesktopSidebar({
  activeTab,
  onTabChange,
  cartCount,
  theme,
  onThemeChange,
  onOpenSuppliers,
  onOpenProfile,
  onOpenProfileSecurity,
  onLogout,
}: DesktopSidebarProps) {
  const { userProfile, isDemoUser, showCosts, setShowCosts } = useInventory();

  const cycleTheme = () => {
    if (theme === "auto") onThemeChange("light");
    else if (theme === "light") onThemeChange("dark");
    else onThemeChange("auto");
  };

  return (
    <aside
      aria-label="Navegación principal de escritorio"
      className="hidden md:flex h-full w-64 shrink-0 flex-col justify-between border-r border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 select-none z-30 transition-colors duration-75"
    >
      {/* 1. Cabecera / Identidad */}
      <div>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-white shadow-md shadow-accent/30 border border-[var(--border-color)] transition-colors duration-200">
            {userProfile?.storeLogoUrl ? (
              <img
                src={userProfile.storeLogoUrl}
                alt={userProfile.storeName || "Logo"}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-[var(--text-primary)] truncate">
                Quiral
              </h1>
              <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-[10px] font-black text-accent transition-colors duration-200">
                POS
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {userProfile?.storeName || "Mi tienda"}
            </p>
          </div>
        </div>

        {/* Badge Demo si aplica */}
        {isDemoUser && (
          <div className="mt-3 mx-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <span className="font-bold">Modo Demo 30/30</span>
            <p className="text-[10px] opacity-85 mt-0.5 leading-tight">Datos de prueba (4 meses)</p>
          </div>
        )}

        {/* 2. Menú de Navegación Vertical */}
        <nav className="mt-6 space-y-1.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onTabChange(id)}
                className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? "bg-accent text-white shadow-md shadow-accent/25"
                    : "text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  <span>{label}</span>
                </div>

                {id === "sell" && cartCount > 0 && (
                  <span
                    className={`tabular-nums rounded-full px-2 py-0.5 text-xs font-black shadow-sm ${
                      isActive ? "bg-white text-accent" : "bg-[#ff3b30] text-white"
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Panel Inferior de Configuración y Usuario */}
      <div className="space-y-2 pt-4 border-t border-[var(--border-color)]">
        {/* Toggle Modo Administrador */}
        <button
          type="button"
          onClick={() => setShowCosts((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
            showCosts
              ? "bg-accent-subtle text-accent"
              : "text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {showCosts ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Modo Administrador</span>
          </div>
          <span className="text-[10px] font-bold uppercase">{showCosts ? "On" : "Off"}</span>
        </button>

        {/* Acceso a Proveedores */}
        <button
          type="button"
          onClick={onOpenSuppliers}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5 transition-colors"
        >
          <Users size={16} />
          <span>Gestión Proveedores</span>
        </button>

        {/* Acceso a Perfil de Tienda */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5 transition-colors"
          >
            <Store size={16} />
            <span>Perfil de Tienda</span>
          </button>
        )}

        {/* Acceso a Perfil y Seguridad */}
        {onOpenProfileSecurity && (
          <button
            type="button"
            onClick={onOpenProfileSecurity}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5 transition-colors"
          >
            <ShieldCheck size={16} />
            <span>Perfil y Seguridad</span>
          </button>
        )}

        {/* Selector de Tema */}
        <button
          type="button"
          onClick={cycleTheme}
          title="Alternar tema visual"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {theme === "light" && <Sun size={16} />}
            {theme === "dark" && <Moon size={16} />}
            {theme === "auto" && <SunMoon size={16} />}
            <span>Tema</span>
          </div>
          <span className="text-[10px] font-bold uppercase">{theme}</span>
        </button>

        {/* Cerrar Sesión */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

