import { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import DesktopSidebar from "./components/DesktopSidebar";
import DesktopStoreProfileView from "./components/DesktopStoreProfileView";
import DesktopSuppliersView from "./components/DesktopSuppliersView";
import FloatingCartFAB from "./components/FloatingCartFAB";
import Navbar, { type NavbarVariant, type Tab } from "./components/Navbar";
import NewProductModal from "./components/NewProductModal";
import ProductDetailModal from "./components/ProductDetailModal";
import ProfileSecurityModal from "./components/ProfileSecurityModal";
import StoreProfileModal from "./components/StoreProfileModal";
import PurgeConfirmModal from "./components/PurgeConfirmModal";
import SuppliersModal from "./components/SuppliersModal";
import TopHeader from "./components/TopHeader";
import { type Theme } from "./components/TopMenu";
import { InventoryProvider, useInventory } from "./context/InventoryContext";
import HistoryView from "./views/HistoryView";
import InventoryView from "./views/InventoryView";
import PosView from "./views/PosView";
import SummaryView from "./views/SummaryView";

function getInitialTheme(): Theme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("quiral-theme");
  } catch (error) {
    console.error("No se pudo leer la preferencia de tema.", error);
  }
  return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("sell");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [navbarVariant] = useState<NavbarVariant>("floating");
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
  const [isDesktopSuppliersView, setIsDesktopSuppliersView] = useState(false);
  const [isProfileSecurityOpen, setIsProfileSecurityOpen] = useState(false);
  const [isStoreProfileOpen, setIsStoreProfileOpen] = useState(false);
  const [isDesktopStoreProfileView, setIsDesktopStoreProfileView] = useState(false);
  const [isInventoryFilterOpen, setIsInventoryFilterOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const {
    userProfile,
    loading,
    isDemoUser,
    signOut,
    refreshData,
    selectedProduct,
    setSelectedProduct,
    showCosts,
    isNewProductModalOpen,
    setIsNewProductModalOpen,
    isPurgeModalOpen,
    setIsPurgeModalOpen,
    cartUnits,
  } = useInventory();

  // Ocultar Navbar cuando cualquier modal o vista secundaria esté activa
  // Se restaura inmediatamente al iniciar la animación de cierre (0ms de retraso percibido)
  const hasActiveModal = Boolean(
    (
      selectedProduct ||
      isNewProductModalOpen ||
      isPurgeModalOpen ||
      isSuppliersModalOpen ||
      isProfileSecurityOpen ||
      isStoreProfileOpen ||
      isInventoryFilterOpen ||
      isCheckoutOpen ||
      isSummaryModalOpen ||
      isHistoryModalOpen
    ) && !isModalClosing
  );

  const handleOpenStoreProfile = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsDesktopStoreProfileView(true);
      setIsDesktopSuppliersView(false);
    } else {
      setIsStoreProfileOpen(true);
    }
  };

  const handleOpenSuppliers = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsDesktopSuppliersView(true);
      setIsDesktopStoreProfileView(false);
    } else {
      setIsSuppliersModalOpen(true);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setIsDesktopStoreProfileView(false);
    setIsDesktopSuppliersView(false);
    setActiveTab(tab);
    requestAnimationFrame(() => {
      if (tab === "inventory") {
        document.getElementById("inventory-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
      } else if (tab === "sell") {
        document.getElementById("pos-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
      } else if (tab === "history") {
        document.getElementById("history-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
      } else if (tab === "summary") {
        document.getElementById("summary-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "auto" && prefersDark.matches);
      root.classList.toggle("dark", isDark);

      // Sincronizar theme-color meta tag para Safari / iOS PWA
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#000000" : "#f2f2f7");
      }
    };

    applyTheme();
    try {
      localStorage.setItem("quiral-theme", theme);
    } catch (error) {
      console.error("No se pudo guardar la preferencia de tema.", error);
    }

    if (theme === "auto") {
      prefersDark.addEventListener("change", applyTheme);
      return () => prefersDark.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  // Pantalla de carga nativa inicial durante la autenticación
  if (!userProfile && loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-primary)] p-6 text-center select-none">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <h2 className="mt-4 text-base font-bold text-[var(--text-primary)]">Iniciando Quiral POS</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Sincronizando estado...</p>
      </div>
    );
  }

  // Pantalla de Autenticación cuando no hay sesión activa
  if (!userProfile) {
    return <AuthScreen onAuthSuccess={refreshData} />;
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] flex relative">
      {/* Navegación lateral persistente para pantallas de escritorio (Apple HIG / macOS POS) */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={cartUnits}
        theme={theme}
        onThemeChange={setTheme}
        onOpenSuppliers={handleOpenSuppliers}
        onOpenProfile={handleOpenStoreProfile}
        onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
        onLogout={signOut}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Cabecera Fija Nativa Superior (100% sólida, sin blur, estática, con diferenciador por props) */}
        <TopHeader
          activeTab={activeTab}
          variant="accent"
          onTabChange={handleTabChange}
          theme={theme}
          onThemeChange={setTheme}
          onOpenSuppliers={handleOpenSuppliers}
          onOpenProfile={handleOpenStoreProfile}
        onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
          onLogout={signOut}
        />

        {/* Contenedor Principal: las vistas manejan su scroll con .quiral-scroll-container */}
        <main className="h-full w-full overflow-hidden relative">
          {isDesktopSuppliersView ? (
            <DesktopSuppliersView onBack={() => setIsDesktopSuppliersView(false)} />
          ) : isDesktopStoreProfileView ? (
            <DesktopStoreProfileView
              onBack={() => setIsDesktopStoreProfileView(false)}
              onOpenSecurity={() => setIsProfileSecurityOpen(true)}
            />
          ) : activeTab === "inventory" ? (
            <InventoryView
              onOpenSuppliers={handleOpenSuppliers}
              onFilterModalStateChange={setIsInventoryFilterOpen}
            />
          ) : activeTab === "sell" ? (
            <PosView onCheckoutStateChange={setIsCheckoutOpen} />
          ) : activeTab === "history" ? (
            <HistoryView
              onGoToPOS={() => handleTabChange("sell")}
              onModalStateChange={setIsHistoryModalOpen}
            />
          ) : activeTab === "summary" ? (
            <SummaryView onModalStateChange={setIsSummaryModalOpen} />
          ) : (
            <div className="quiral-scroll-container px-4 pb-6 text-center text-[var(--text-secondary)]">
              <p className="text-base font-semibold pt-12">Esta sección estará disponible próximamente.</p>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-200"
              >
                Volver a Inventario
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Botón flotante de acceso rápido a Vender en todas las pantallas distintas a Vender */}
      <FloatingCartFAB
        cartCount={cartUnits}
        onClick={() => handleTabChange("sell")}
        isVisible={!hasActiveModal && activeTab !== "sell"}
      />

      {/* 
        Barra de Navegación Inferior Flotante:
        Permanece en el árbol DOM para mantener caliente la superficie GPU con backdrop-blur (42px).
        Se oculta y restaura instantáneamente (0ms reflow) mediante transformaciones de hardware.
      */}
      <Navbar
        activeTab={activeTab}
        cartCount={cartUnits}
        onTabChange={handleTabChange}
        variant={navbarVariant}
        isVisible={!hasActiveModal}
      />

      {/* 
        Modales Globales a nivel raíz:
        Al montarse fuera de <main>, no quedan atrapados en contextos de apilamiento (stacking context)
      */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          showCosts={showCosts}
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setSelectedProduct(null);
            setIsModalClosing(false);
          }}
          onOpenSuppliers={() => setIsSuppliersModalOpen(true)}
        />
      )}

      {isNewProductModalOpen && (
        <NewProductModal
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setIsNewProductModalOpen(false);
            setIsModalClosing(false);
          }}
          onOpenSuppliers={() => setIsSuppliersModalOpen(true)}
        />
      )}

      {isPurgeModalOpen && (
        <PurgeConfirmModal
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setIsPurgeModalOpen(false);
            setIsModalClosing(false);
          }}
        />
      )}

      {isSuppliersModalOpen && (
        <SuppliersModal
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setIsSuppliersModalOpen(false);
            setIsModalClosing(false);
          }}
        />
      )}

      {isStoreProfileOpen && (
        <StoreProfileModal
          isOpen={isStoreProfileOpen}
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setIsStoreProfileOpen(false);
            setIsModalClosing(false);
          }}
          onOpenSecurity={() => setIsProfileSecurityOpen(true)}
        />
      )}

      {isProfileSecurityOpen && userProfile && (
        <ProfileSecurityModal
          isOpen={isProfileSecurityOpen}
          onStartClose={() => setIsModalClosing(true)}
          onClose={() => {
            setIsProfileSecurityOpen(false);
            setIsModalClosing(false);
          }}
          currentUsername={userProfile.username}
          storeName={userProfile.storeName}
          userEmail={userProfile.email}
          role={userProfile.role}
          isDemoUser={isDemoUser}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <AppInner />
    </InventoryProvider>
  );
}
