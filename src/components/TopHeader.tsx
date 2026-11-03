import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import AdminCompactButton from "./AdminCompactButton";
import { useInventory } from "../context/InventoryContext";
import { Tab } from "./Navbar";
import TopMenu, { Theme } from "./TopMenu";

export type HeaderVariant = "default" | "accent";

interface TopHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenSuppliers: () => void;
  onOpenProfile?: () => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
  variant?: HeaderVariant;
}

const TAB_TITLES: Record<Tab, string> = {
  inventory: "Inventario",
  sell: "Vender",
  summary: "Resumen",
  history: "Historial",
};

/**
 * TopHeader — Cabecera Fija Nativa Superior (Apple HIG)
 */
export default function TopHeader({
  activeTab,
  onTabChange,
  theme,
  onThemeChange,
  onOpenSuppliers,
  onOpenProfile,
  onOpenProfileSecurity,
  onLogout,
  variant = "default",
}: TopHeaderProps) {
  const { userProfile, setIsNewProductModalOpen, setIsPurgeModalOpen, showCosts, setShowCosts, isDemoUser } = useInventory();

  const title = TAB_TITLES[activeTab] || "Quiral";
  const isAccent = variant === "accent";

  return (
    <header
      className={`quiral-top-header md:hidden fixed top-0 w-full z-50 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] select-none transition-colors duration-200 ${
        isAccent ? "border-b !border-accent/20 dark:!border-accent/30" : ""
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-xl md:max-w-4xl lg:max-w-5xl items-center justify-between gap-3">
        {/* Título: flexible con truncamiento para nunca empujar los controles */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {userProfile?.storeLogoUrl && (
            <img
              src={userProfile.storeLogoUrl}
              alt={userProfile.storeName || "Logo"}
              className="h-8 w-8 rounded-xl object-cover border border-[var(--border-color)] shrink-0 shadow-sm"
            />
          )}
          <button
            type="button"
            onClick={() => onTabChange(activeTab)}
            className="min-w-0 text-left"
            aria-label={`Volver al inicio de ${title}`}
          >
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight truncate transition-colors duration-200 ${
                isAccent
                  ? "text-accent"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {title}
            </h1>
          </button>

          {isDemoUser && (
            <span
              title="Entorno de prueba pública 30/30"
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0"
            >
              Demo 30/30
            </span>
          )}
        </div>

        {/* Controles de Acción: Flexbox unificado, sin posiciones absolutas */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeTab === "inventory" && (
            <>
              {/* Control único y compacto de Modo Administrador */}
              <AdminCompactButton />

              {/* Botón: Purgar productos agotados */}
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(true)}
                title="Purgar productos agotados"
                aria-label="Purgar stock agotado"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#ff3b30] shadow-sm transition-colors duration-75 hover:bg-[#ff3b30]/20 active:scale-95"
              >
                <Trash2 size={16} />
              </button>

              {/* Botón: Crear nuevo producto con acento azul primario estándar */}
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(true)}
                title="Crear nuevo producto"
                aria-label="Nuevo producto"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] text-accent shadow-sm transition-colors duration-200 hover:opacity-80 active:scale-95"
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            </>
          )}

          {activeTab === "summary" && (
            <button
              type="button"
              onClick={() => setShowCosts((prev) => !prev)}
              title={
                !showCosts
                  ? "Modo privacidad activo (ocultando montos sensibles)"
                  : "Mostrar u ocultar montos sensibles"
              }
              aria-label={!showCosts ? "Modo privacidad activo" : "Modo privacidad inactivo"}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold shadow-sm transition-colors duration-75 active:scale-95 select-none shrink-0 ${
                !showCosts
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              } w-9 min-[420px]:w-auto min-[420px]:px-2.5`}
            >
              {!showCosts ? (
                <EyeOff size={16} className="shrink-0" />
              ) : (
                <Eye size={16} className="shrink-0 text-accent transition-colors duration-200" />
              )}
              <span className="hidden min-[420px]:inline whitespace-nowrap leading-none transition-none">
                {!showCosts ? "Privacidad" : "Visible"}
              </span>
            </button>
          )}

          {/* Menú de configuración persistente */}
          <TopMenu
            theme={theme}
            onThemeChange={onThemeChange}
            onOpenSuppliers={onOpenSuppliers}
            onOpenProfile={onOpenProfile}
            onOpenProfileSecurity={onOpenProfileSecurity}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}
