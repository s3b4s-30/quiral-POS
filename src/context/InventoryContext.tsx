import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getStoreMembership,
  printSecurityWarning,
  signOutUser,
} from "../lib/authService";
import {
  DEMO_STORE_ID,
  ensureFreshDemoStorage,
  generateDemoSeed,
} from "../lib/demoSeed";
import { supabase } from "../lib/supabase";
import {
  deleteAllProductsRecords,
  deleteMultipleProductsRecords,
  deleteProductRecord,
  deleteSaleRecord,
  deleteSupplierRecord,
  executeCompleteSaleRpc,
  fetchStoreInventoryBundle,
  fetchStoreSalesBundle,
  persistCatalogConfigRpc,
  persistClosureRecord,
  persistProductRecord,
  persistSaleRecord,
  persistSupplierRecord,
  purgeLegacySeededSales,
  purgeProductsRecords,
  subscribeToStoreRealtime,
  updateStoreNameRecord,
} from "../services";
import {
  cacheCatalogSnapshot,
  cacheSuppliersSnapshot,
  enqueueOfflineSale,
  getCachedCatalogSnapshot,
  getCachedSuppliersSnapshot,
} from "../services/offlineDb";
import { flushSalesQueue } from "../services/offlineSyncService";
import {
  AccentPaletteId,
  Batch,
  CartItem,
  CatalogConfig,
  CategoryConfig,
  Closure,
  PaymentMethod,
  Product,
  ProductCategory,
  Sale,
  SaleItem,
  Supplier,
  UserProfile,
} from "../types/domain";
import {
  DEFAULT_CATALOG_CONFIG,
  FACTORY_BASE_CATEGORIES,
  FALLBACK_ORPHAN_CATEGORY,
  getEffectiveAttributeOptions,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  mergeWithDefaultCatalogConfig,
  normalizeCatalogText,
  structuredCloneConfig,
} from "../utils/catalogConfig";
import { applyPalette, getStoredPalette } from "../utils/themePalettes";

export const SUPPLIER_PALETTE = [
  "#007AFF",
  "#AF52DE",
  "#28CD41",
  "#FF9500",
  "#5AC8FA",
  "#FF3B30",
  "#00A3BF",
  "#0051D5",
  "#FFCC00",
  "#FF6B22",
  "#FF2D55",
  "#8E8E93",
  "#5856D6",
];

interface InventoryContextType {
  suppliers: Supplier[];
  products: Product[];
  sales: Sale[];
  closures: Closure[];
  loading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  isDemoUser: boolean;
  showCosts: boolean;
  setShowCosts: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isNewProductModalOpen: boolean;
  setIsNewProductModalOpen: (open: boolean) => void;
  isPurgeModalOpen: boolean;
  setIsPurgeModalOpen: (open: boolean) => void;
  lastSelectedSupplierId: string | null;
  setLastSelectedSupplierId: (id: string | null) => void;
  cart: CartItem[];
  cartUnits: number;
  addToCart: (productId: string) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, unitPrice: number) => void;
  updateCartItemBatch: (productId: string, batchId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  completeSale: (
    paymentMethod: PaymentMethod,
    total: number,
    customerName?: string
  ) => boolean;
  updateSale: (updatedSale: Sale) => void;
  deleteSale: (saleId: string, restoreStock?: boolean) => void;
  createClosure: (
    data: Omit<Closure, "id" | "closedAt"> & { id?: string; closedAt?: string }
  ) => void;
  toggleItemWarranty: (saleId: string, itemId: string, note?: string) => void;
  addSupplier: (data: Omit<Supplier, "id">) => Supplier;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustBatchStock: (productId: string, batchId: string, delta: number) => void;
  adjustMasterStock: (productId: string, delta: number) => void;
  addBatchToProduct: (productId: string, batch: Omit<Batch, "id">) => void;
  updateProductPrice: (productId: string, price: number) => void;
  accentPalette: AccentPaletteId;
  setAccentPalette: (palette: AccentPaletteId) => void;
  updateStoreProfile: (updates: {
    storeName: string;
    storePhone?: string;
    storeAddress?: string;
    storeLogoUrl?: string;
    accentPalette?: AccentPaletteId;
  }) => Promise<void>;
  purgeOutOfStock: () => number;
  deleteMultipleProducts: (productIds: string[]) => Promise<number>;
  clearAllProducts: () => Promise<number>;
  catalogConfig: CatalogConfig;
  updateCategoryOrder: (newOrder: ProductCategory[]) => void;
  addCategory: (
    name: string,
    attributeKeys?: string[]
  ) => CategoryConfig | null;
  deleteCategory: (
    categoryName: ProductCategory,
    fallbackCategory?: ProductCategory
  ) => Promise<number>;
  updateCategoryAttributes: (
    categoryName: ProductCategory,
    attributeKeys: string[]
  ) => void;
  addAttributeOption: (
    attributeKey: string,
    newOption: string,
    categoryName?: ProductCategory
  ) => string | null;
  renameAttributeOption: (
    attributeKey: string,
    oldOption: string,
    newOption: string,
    categoryName?: ProductCategory
  ) => boolean;
  deleteAttributeOption: (
    attributeKey: string,
    optionToRemove: string,
    categoryName?: ProductCategory
  ) => void;
  reorderAttributeOptions: (
    attributeKey: string,
    newOptions: string[],
    categoryName?: ProductCategory
  ) => void;
  resetCategoryAttributeOptionsToGlobal: (
    categoryName: ProductCategory,
    attributeKey: string
  ) => void;
  createCustomAttribute: (
    label: string,
    initialOptions?: string[]
  ) => string | null;
  resetCatalogConfigToDefault: () => void;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

const getStoredStoreProfile = (storeId: string): Partial<UserProfile> => {
  try {
    const raw = localStorage.getItem(`quiral_store_profile_${storeId}`);
    if (raw) return JSON.parse(raw) as Partial<UserProfile>;
  } catch {}
  return {};
};

const getStoredCatalogConfig = (targetStoreId: string): CatalogConfig => {
  ensureFreshDemoStorage();
  try {
    const raw = localStorage.getItem(
      `quiral_catalog_config_v3_${targetStoreId}`
    );
    if (raw) {
      return mergeWithDefaultCatalogConfig(
        JSON.parse(raw) as Partial<CatalogConfig>
      );
    }
  } catch {}
  return mergeWithDefaultCatalogConfig(null);
};

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

const normalizedProduct = (p: Product): Product => ({
  ...p,
  price: Math.max(0, Math.round(p.price)),
  warrantyDays: Math.max(0, Math.floor(p.warrantyDays)),
  batches: p.batches.map((b) => ({
    ...b,
    cost: Math.max(0, Math.round(b.cost)),
    stock: Math.max(0, Math.floor(b.stock)),
  })),
});

/** Deduplica ventas por ID y por número de venta, ordenando de más reciente a más antigua */
function deduplicateSales(list: Sale[]): Sale[] {
  const seenIds = new Set<string>();
  const seenNumbers = new Set<number>();
  const result: Sale[] = [];

  for (const s of list) {
    if (!s || !s.id) continue;
    // Ignorar semillas artificiales masivas heredadas (demo-sale-1..118)
    if (s.id.startsWith("demo-sale-")) continue;
    if (seenIds.has(s.id)) continue;
    if (typeof s.saleNumber === "number" && seenNumbers.has(s.saleNumber))
      continue;

    seenIds.add(s.id);
    if (typeof s.saleNumber === "number") {
      seenNumbers.add(s.saleNumber);
    }
    result.push(s);
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem("quiral_demo_bypass") === "true";
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [catalogConfig, setCatalogConfig] = useState<CatalogConfig>(() =>
    getStoredCatalogConfig(DEMO_STORE_ID)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCosts, setShowCosts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [lastSelectedSupplierId, setLastSelectedSupplierId] = useState<
    string | null
  >(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [accentPalette, setAccentPaletteState] =
    useState<AccentPaletteId>(getStoredPalette);

  const setAccentPalette = useCallback((palette: AccentPaletteId) => {
    applyPalette(palette);
    setAccentPaletteState(palette);
  }, []);

  // Guardias y referencias de ciclo de vida (Anti-bucles y control de concurrencia)
  const syncInProgressRef = useRef(false);
  const saleInFlightRef = useRef(false);
  const activeStoreRequestIdRef = useRef(0);
  const lastLoadedStoreIdRef = useRef<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const report = useCallback((message: string) => {
    console.error(message);
    setError(message);
  }, []);

  // Carga de datos de la tienda desde Supabase con respaldo local aislado para demo
  const loadData = useCallback(
    async (activeStore: string, isDemo = false) => {
      const requestId = ++activeStoreRequestIdRef.current;
      setLoading(true);

      if (isDemo) {
        printSecurityWarning();
        ensureFreshDemoStorage();
        const demoData = generateDemoSeed();
        try {
          const storedSalesRaw = localStorage.getItem(
            `quiral_demo_sales_v3_${activeStore}`
          );
          const storedSales = storedSalesRaw
            ? (JSON.parse(storedSalesRaw) as Sale[])
            : demoData.sales;
          setSuppliers(demoData.suppliers);
          setProducts(demoData.products);
          setSales(deduplicateSales(storedSales));
          setClosures(demoData.closures);
          setCatalogConfig(getStoredCatalogConfig(activeStore));
        } catch {
          setSuppliers(demoData.suppliers);
          setProducts(demoData.products);
          setSales([]);
          setClosures([]);
        }
        setError(null);
        lastLoadedStoreIdRef.current = activeStore;
        setLoading(false);
        return;
      }

      try {
        const [invData, salesData] = await Promise.all([
          fetchStoreInventoryBundle(activeStore),
          fetchStoreSalesBundle(activeStore),
        ]);

        if (requestId !== activeStoreRequestIdRef.current) return;

        const loadedSuppliers = invData.suppliers;
        const loadedProducts = invData.products;
        const rawSales = salesData.sales;
        const rawClosures = salesData.closures;

        // Si existen ventas semilla heredadas ("demo-sale-*") en la tienda de Supabase, purgarlas en background
        const hasLegacySeededSales = rawSales.some((s) =>
          s?.id?.startsWith("demo-sale-")
        );
        if (hasLegacySeededSales) {
          void purgeLegacySeededSales(activeStore);
        }

        const cleanSales = deduplicateSales(rawSales);
        const cleanClosures = rawClosures.filter(
          (c) => !c?.id?.startsWith("demo-cycle-")
        );

        setSuppliers(loadedSuppliers);
        setProducts(loadedProducts);
        setSales(cleanSales);
        setClosures(cleanClosures);

        // Cachear instantánea local en IndexedDB (Dexie) para disponibilidad offline
        void cacheCatalogSnapshot(activeStore, loadedProducts);
        void cacheSuppliersSnapshot(activeStore, loadedSuppliers);
        // Sincronizar automáticamente cualquier venta pendiente acumulada en la cola offline
        void flushSalesQueue(activeStore);

        if (invData.catalogConfigRaw) {
          const mergedRemote = mergeWithDefaultCatalogConfig(
            invData.catalogConfigRaw as Partial<CatalogConfig>
          );
          setCatalogConfig(mergedRemote);
          try {
            localStorage.setItem(
              `quiral_catalog_config_v3_${activeStore}`,
              JSON.stringify(mergedRemote)
            );
          } catch {}
        } else {
          setCatalogConfig(getStoredCatalogConfig(activeStore));
        }

        setError(null);
        lastLoadedStoreIdRef.current = activeStore;
      } catch (fetchErr: unknown) {
        if (requestId !== activeStoreRequestIdRef.current) return;
        const errMsg =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.warn("Fallo al conectar con Supabase:", fetchErr);

        // Si no hay red, recuperar catálogo e inventario local desde IndexedDB (Dexie)
        try {
          const [cachedProds, cachedSups] = await Promise.all([
            getCachedCatalogSnapshot(activeStore),
            getCachedSuppliersSnapshot(activeStore),
          ]);
          if (cachedProds.length > 0) {
            setProducts(cachedProds);
            setSuppliers(cachedSups);
            report("Modo Offline: catálogo cargado desde la memoria local");
          } else {
            report(`Error de conexión: ${errMsg || "Sin red"}`);
          }
        } catch {
          report(`Error de conexión: ${errMsg || "Sin red"}`);
        }
      } finally {
        if (requestId === activeStoreRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [report]
  );

  // Sincronización atómica e inmediata de sesión y perfil de tienda
  const syncUserSession = useCallback(
    async (providedSession?: Session | null) => {
      if (syncInProgressRef.current) return;
      syncInProgressRef.current = true;

      setLoading(true);
      try {
        const hasDemoBypass =
          localStorage.getItem("quiral_demo_bypass") === "true";

        if (hasDemoBypass) {
          printSecurityWarning();
          setIsDemoUser(true);
          const localStore = getStoredStoreProfile(DEMO_STORE_ID);
          const demoProfile: UserProfile = {
            id: "demo-user-30",
            email: "demo30@quiral.xyz",
            username: "30",
            storeId: DEMO_STORE_ID,
            storeName: localStore.storeName || "Quiral Demo 30",
            storePhone: localStore.storePhone,
            storeAddress: localStore.storeAddress,
            storeLogoUrl: localStore.storeLogoUrl,
            role: "owner",
            isDemoUser: true,
          };
          setUserProfile(demoProfile);
          setStoreId(DEMO_STORE_ID);
          lastLoadedUserIdRef.current = demoProfile.id;
          await loadData(DEMO_STORE_ID, true);
          return;
        }

        let session = providedSession;
        if (session === undefined) {
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session ?? null;
        }

        if (session?.user) {
          let membership = await getStoreMembership(session.user.id);
          if (!membership) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            membership = await getStoreMembership(session.user.id);
          }

          if (membership) {
            const localStore = getStoredStoreProfile(membership.storeId);
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              username: membership.username,
              storeId: membership.storeId,
              storeName: localStore.storeName || membership.storeName,
              storePhone: localStore.storePhone,
              storeAddress: localStore.storeAddress,
              storeLogoUrl: localStore.storeLogoUrl,
              role: membership.role,
              isDemoUser: false,
            };
            setUserProfile(profile);
            setStoreId(membership.storeId);
            setIsDemoUser(false);
            lastLoadedUserIdRef.current = profile.id;
            await loadData(membership.storeId, false);
          } else {
            const meta = session.user.user_metadata || {};
            const fallbackStoreId =
              (meta.store_id as string) || session.user.id;
            const fallbackStoreName =
              (meta.store_name as string) || "Mi tienda";
            const fallbackUsername =
              (meta.username as string) ||
              session.user.email?.split("@")[0] ||
              "Usuario";

            const localStore = getStoredStoreProfile(fallbackStoreId);
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              username: fallbackUsername,
              storeId: fallbackStoreId,
              storeName: localStore.storeName || fallbackStoreName,
              storePhone: localStore.storePhone,
              storeAddress: localStore.storeAddress,
              storeLogoUrl: localStore.storeLogoUrl,
              role: "owner",
              isDemoUser: false,
            };
            setUserProfile(profile);
            setStoreId(fallbackStoreId);
            setIsDemoUser(false);
            lastLoadedUserIdRef.current = profile.id;
            await loadData(fallbackStoreId, false);
          }
        } else {
          setUserProfile(null);
          setStoreId(null);
          setIsDemoUser(false);
          lastLoadedUserIdRef.current = null;
          lastLoadedStoreIdRef.current = null;
        }
      } catch (err) {
        console.error("Error sincronizando sesión:", err);
      } finally {
        syncInProgressRef.current = false;
        setLoading(false);
      }
    },
    [loadData]
  );

  // Manejo de sesión y suscripción en tiempo real
  useEffect(() => {
    void syncUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUserProfile(null);
          setStoreId(null);
          setSuppliers([]);
          setProducts([]);
          setSales([]);
          setClosures([]);
          setLoading(false);
          localStorage.removeItem("quiral_demo_bypass");
          setIsDemoUser(false);
          lastLoadedUserIdRef.current = null;
          lastLoadedStoreIdRef.current = null;
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          if (
            session?.user &&
            lastLoadedUserIdRef.current === session.user.id &&
            lastLoadedStoreIdRef.current !== null
          ) {
            return;
          }
        }

        if (
          event === "SIGNED_IN" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          if (session) {
            await syncUserSession(session);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncUserSession]);

  // Suscripción Realtime a cambios concurrentes de la tienda activa
  useEffect(() => {
    if (!storeId || isDemoUser) return;

    const unsubscribe = subscribeToStoreRealtime(storeId, {
      onSupplierInsert: (rowData) => {
        setSuppliers((prev) => [
          rowData,
          ...prev.filter((s) => s.id !== rowData.id),
        ]);
      },
      onSupplierUpdate: (rowData) => {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === rowData.id ? rowData : s))
        );
      },
      onSupplierDelete: (oldId) => {
        setSuppliers((prev) => prev.filter((s) => s.id !== oldId));
      },
      onProductInsert: (rowData) => {
        setProducts((prev) => [
          rowData,
          ...prev.filter((p) => p.id !== rowData.id),
        ]);
      },
      onProductUpdate: (rowData) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === rowData.id ? rowData : p))
        );
      },
      onProductDelete: (oldId) => {
        setProducts((prev) => prev.filter((p) => p.id !== oldId));
      },
      onSaleInsert: (rowData) => {
        setSales((prev) => deduplicateSales([rowData, ...prev]));
      },
      onSaleUpdate: (rowData) => {
        setSales((prev) =>
          prev.map((s) => (s.id === rowData.id ? rowData : s))
        );
      },
      onSaleDelete: (oldId) => {
        setSales((prev) => prev.filter((s) => s.id !== oldId));
      },
      onClosureInsert: (rowData) => {
        setClosures((prev) => [
          rowData,
          ...prev.filter((c) => c.id !== rowData.id),
        ]);
      },
      onClosureUpdate: (rowData) => {
        setClosures((prev) =>
          prev.map((c) => (c.id === rowData.id ? rowData : c))
        );
      },
      onClosureDelete: (oldId) => {
        setClosures((prev) => prev.filter((c) => c.id !== oldId));
      },
    });

    return () => {
      unsubscribe();
    };
  }, [storeId, isDemoUser]);

  // Persistencia de ventas demo en localStorage
  const persistDemoSales = useCallback(
    (nextSales: Sale[]) => {
      if (!storeId || !isDemoUser) return;
      try {
        localStorage.setItem(
          `quiral_demo_sales_v3_${storeId}`,
          JSON.stringify(nextSales)
        );
      } catch {}
    },
    [storeId, isDemoUser]
  );

  // Persistencia segura en Supabase mediante la capa de servicios
  const persist = useCallback(
    async (table: string, entity: { id: string }) => {
      if (!storeId || isDemoUser) return;
      if (table === "suppliers") {
        await persistSupplierRecord(storeId, entity as unknown as Supplier);
      } else if (table === "products") {
        await persistProductRecord(storeId, entity as unknown as Product);
      } else if (table === "sales") {
        await persistSaleRecord(storeId, entity as unknown as Sale);
      } else if (table === "cycle_closings") {
        await persistClosureRecord(storeId, entity as unknown as Closure);
      }
    },
    [storeId, isDemoUser]
  );

  const cartUnits = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Proveedores
  const addSupplier = (data: Omit<Supplier, "id">) => {
    const value: Supplier = { ...data, id: makeId("sup") };
    setSuppliers((prev) => [value, ...prev]);
    void persist("suppliers", value).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
    return value;
  };

  const updateSupplier = (value: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === value.id ? value : s)));
    void persist("suppliers", value).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    if (storeId && !isDemoUser) {
      void deleteSupplierRecord(storeId, id).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al eliminar proveedor: ${msg}`);
      });
    }
  };

  const getSupplier = (id: string) => suppliers.find((s) => s.id === id);

  // Productos
  const addProduct = (data: Omit<Product, "id" | "createdAt">) => {
    const value = normalizedProduct({
      ...data,
      id: makeId("prod"),
      createdAt: new Date().toISOString(),
    });
    setProducts((prev) => [value, ...prev]);
    void persist("products", value).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
    return value;
  };

  const updateProduct = (value: Product) => {
    const norm = normalizedProduct(value);
    setProducts((prev) => prev.map((p) => (p.id === norm.id ? norm : p)));
    void persist("products", norm).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (storeId && !isDemoUser) {
      void deleteProductRecord(storeId, id).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al eliminar producto: ${msg}`);
      });
    }
  };

  const mutateProduct = (
    productId: string,
    mutator: (p: Product) => Product
  ) => {
    const current = products.find((p) => p.id === productId);
    if (current) {
      updateProduct(mutator(current));
    }
  };

  const adjustBatchStock = (
    productId: string,
    batchId: string,
    delta: number
  ) => {
    mutateProduct(productId, (p) => ({
      ...p,
      batches: p.batches.map((b) =>
        b.id === batchId
          ? { ...b, stock: Math.max(0, b.stock + Math.trunc(delta)) }
          : b
      ),
    }));
  };

  const adjustMasterStock = (productId: string, delta: number) => {
    mutateProduct(productId, (p) => {
      const batches = p.batches.map((b) => ({ ...b }));
      const steps = Math.abs(Math.trunc(delta));
      for (let i = 0; i < steps; i++) {
        const candidates = batches
          .map((b, index) => ({ b, index }))
          .filter((x) => delta > 0 || x.b.stock > 0);

        const target = candidates.sort(
          (a, b) => b.b.stock - a.b.stock || a.index - b.index
        )[0];

        if (!target) break;
        target.b.stock += delta > 0 ? 1 : -1;
      }
      return { ...p, batches };
    });
  };

  const addBatchToProduct = (productId: string, data: Omit<Batch, "id">) => {
    mutateProduct(productId, (p) => ({
      ...p,
      batches: [
        ...p.batches,
        {
          ...data,
          id: makeId("batch"),
          cost: Math.max(0, Math.round(data.cost)),
          stock: Math.max(0, Math.floor(data.stock)),
        },
      ],
    }));
  };

  const updateProductPrice = (productId: string, price: number) => {
    mutateProduct(productId, (p) => ({
      ...p,
      price: Math.max(0, Math.round(price)),
    }));
  };

  const purgeOutOfStock = () => {
    const removed = products.filter((p) =>
      p.batches.every((b) => b.stock === 0)
    );
    setProducts((prev) =>
      prev.filter((p) => !removed.some((r) => r.id === p.id))
    );
    if (storeId && !isDemoUser && removed.length > 0) {
      void purgeProductsRecords(
        storeId,
        removed.map((p) => p.id)
      ).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al purgar productos agotados: ${msg}`);
      });
    }
    return removed.length;
  };
  const deleteMultipleProducts = async (
    productIds: string[]
  ): Promise<number> => {
    if (!productIds || productIds.length === 0) return 0;
    const idsSet = new Set(productIds);
    setProducts((prev) => prev.filter((p) => !idsSet.has(p.id)));
    setCart((prev) => prev.filter((item) => !idsSet.has(item.productId)));

    if (storeId && !isDemoUser) {
      try {
        await deleteMultipleProductsRecords(storeId, productIds);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al eliminar productos seleccionados: ${msg}`);
      }
    }
    return productIds.length;
  };

  const clearAllProducts = async (): Promise<number> => {
    const totalCount = products.length;
    setProducts([]);
    setCart([]);

    if (storeId && !isDemoUser) {
      try {
        await deleteAllProductsRecords(storeId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al vaciar catálogo: ${msg}`);
      }
    }
    return totalCount;
  };

  // Persistencia de configuración modular de catálogo y atributos
  const persistCatalogConfig = useCallback(
    (nextConfig: CatalogConfig) => {
      const activeStore = storeId || DEMO_STORE_ID;
      try {
        localStorage.setItem(
          `quiral_catalog_config_v3_${activeStore}`,
          JSON.stringify(nextConfig)
        );
      } catch (err) {
        console.warn("Error guardando catalogConfig en localStorage:", err);
      }

      if (storeId && !isDemoUser) {
        void persistCatalogConfigRpc(storeId, nextConfig);
      }
    },
    [storeId, isDemoUser]
  );

  const updateCategoryOrder = (newOrder: ProductCategory[]) => {
    setCatalogConfig((prev) => {
      const seen = new Set<string>();
      const cleanOrder: ProductCategory[] = [];

      for (const item of newOrder) {
        const norm = normalizeCatalogText(item);
        if (!norm || norm.toLowerCase() === "todos") continue;
        const lower = norm.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          cleanOrder.push(norm);
        }
      }

      const next: CatalogConfig = {
        ...prev,
        categoryOrder: cleanOrder,
      };
      persistCatalogConfig(next);
      return next;
    });
  };

  const addCategory = (
    name: string,
    attributeKeys?: string[]
  ): CategoryConfig | null => {
    const cleanName = normalizeCatalogText(name);
    if (!cleanName || cleanName.toLowerCase() === "todos") return null;

    const existing = catalogConfig.categories.find((c) =>
      isSameCatalogText(c.name, cleanName)
    );

    const keys =
      attributeKeys && attributeKeys.length > 0
        ? [...attributeKeys]
        : (existing?.attributeKeys ?? inferAttributeKeysForCategory(cleanName));

    if (existing) {
      const updatedExisting: CategoryConfig = {
        ...existing,
        attributeKeys: keys,
      };
      const isInOrder = catalogConfig.categoryOrder.some((c) =>
        isSameCatalogText(c, existing.name)
      );
      const nextOrder = isInOrder
        ? [...catalogConfig.categoryOrder]
        : [...catalogConfig.categoryOrder, existing.name];

      const nextCategories = catalogConfig.categories.map((c) =>
        isSameCatalogText(c.name, existing.name) ? updatedExisting : c
      );

      const nextConfig: CatalogConfig = {
        ...catalogConfig,
        categoryOrder: nextOrder,
        categories: nextCategories,
      };
      setCatalogConfig(nextConfig);
      persistCatalogConfig(nextConfig);
      return updatedExisting;
    }

    const newCat: CategoryConfig = {
      name: cleanName,
      isSystemDefault: FACTORY_BASE_CATEGORIES.some((b) =>
        isSameCatalogText(b, cleanName)
      ),
      attributeKeys: keys,
    };

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      categoryOrder: [...catalogConfig.categoryOrder, cleanName],
      categories: [...catalogConfig.categories, newCat],
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
    return newCat;
  };

  const deleteCategory = async (
    categoryName: ProductCategory,
    fallbackCategory: ProductCategory = FALLBACK_ORPHAN_CATEGORY
  ): Promise<number> => {
    const isFactory = FACTORY_BASE_CATEGORIES.some((b) =>
      isSameCatalogText(b, categoryName)
    );

    const affectedProducts = products.filter((p) =>
      isSameCatalogText(p.category, categoryName)
    );
    const cleanFallback =
      normalizeCatalogText(fallbackCategory) || FALLBACK_ORPHAN_CATEGORY;

    if (affectedProducts.length > 0) {
      const updatedList: Product[] = [];
      setProducts((prev) =>
        prev.map((p) => {
          if (!isSameCatalogText(p.category, categoryName)) return p;
          const moved: Product = { ...p, category: cleanFallback };
          updatedList.push(moved);
          return moved;
        })
      );

      for (const mp of updatedList) {
        void persist("products", mp).catch((err: unknown) => {
          report(err instanceof Error ? err.message : String(err));
        });
      }
    }

    setCatalogConfig((prev) => {
      // Si es categoría base de fábrica, se conserva su definición en `categories` (Respaldo) y solo sale de `categoryOrder`
      const nextCategories = isFactory
        ? [...prev.categories]
        : prev.categories.filter(
            (c) => !isSameCatalogText(c.name, categoryName)
          );

      const nextOrder = prev.categoryOrder.filter(
        (c) => !isSameCatalogText(c, categoryName)
      );

      if (
        affectedProducts.length > 0 &&
        !nextCategories.some((c) => isSameCatalogText(c.name, cleanFallback))
      ) {
        nextCategories.push({
          name: cleanFallback,
          isSystemDefault: false,
          attributeKeys: inferAttributeKeysForCategory(cleanFallback),
        });
      }

      if (
        affectedProducts.length > 0 &&
        !nextOrder.some((c) => isSameCatalogText(c, cleanFallback))
      ) {
        nextOrder.push(cleanFallback);
      }

      const next: CatalogConfig = {
        ...prev,
        categoryOrder: nextOrder,
        categories: nextCategories,
      };
      persistCatalogConfig(next);
      return next;
    });

    return affectedProducts.length;
  };

  const updateCategoryAttributes = (
    categoryName: ProductCategory,
    attributeKeys: string[]
  ) => {
    if (attributeKeys.length === 0) return;
    setCatalogConfig((prev) => {
      const nextCategories = prev.categories.map((c) =>
        isSameCatalogText(c.name, categoryName)
          ? { ...c, attributeKeys: [...attributeKeys] }
          : c
      );
      const next: CatalogConfig = {
        ...prev,
        categories: nextCategories,
      };
      persistCatalogConfig(next);
      return next;
    });
  };

  const addAttributeOption = (
    attributeKey: string,
    newOption: string,
    categoryName?: ProductCategory
  ): string | null => {
    const cleanOpt = normalizeCatalogText(newOption);
    if (!cleanOpt) return null;

    const currentAttr = catalogConfig.attributes[attributeKey];
    if (!currentAttr) return null;

    if (categoryName) {
      const currentOpts = getEffectiveAttributeOptions(
        catalogConfig,
        categoryName,
        attributeKey
      );
      const existingMatch = currentOpts.find((opt) =>
        isSameCatalogText(opt, cleanOpt)
      );
      if (existingMatch) {
        return existingMatch;
      }

      const cleanCat = normalizeCatalogText(categoryName);
      const nextConfig: CatalogConfig = {
        ...catalogConfig,
        categoryAttributeValues: {
          ...catalogConfig.categoryAttributeValues,
          [cleanCat]: {
            ...(catalogConfig.categoryAttributeValues?.[cleanCat] || {}),
            [attributeKey]: [...currentOpts, cleanOpt],
          },
        },
      };
      setCatalogConfig(nextConfig);
      persistCatalogConfig(nextConfig);
      return cleanOpt;
    }

    const existingMatch = currentAttr.options.find((opt) =>
      isSameCatalogText(opt, cleanOpt)
    );
    if (existingMatch) {
      return existingMatch;
    }

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      attributes: {
        ...catalogConfig.attributes,
        [attributeKey]: {
          ...currentAttr,
          options: [...currentAttr.options, cleanOpt],
        },
      },
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
    return cleanOpt;
  };

  const renameAttributeOption = (
    attributeKey: string,
    oldOption: string,
    newOption: string,
    categoryName?: ProductCategory
  ): boolean => {
    const cleanNew = normalizeCatalogText(newOption);
    if (!cleanNew) return false;

    const currentAttr = catalogConfig.attributes[attributeKey];
    if (!currentAttr) return false;

    if (categoryName) {
      const currentOpts = getEffectiveAttributeOptions(
        catalogConfig,
        categoryName,
        attributeKey
      );
      const duplicate = currentOpts.find(
        (opt) =>
          !isSameCatalogText(opt, oldOption) && isSameCatalogText(opt, cleanNew)
      );
      if (duplicate) return false;

      const nextOptions = currentOpts.map((opt) =>
        isSameCatalogText(opt, oldOption) ? cleanNew : opt
      );

      const cleanCat = normalizeCatalogText(categoryName);
      const nextConfig: CatalogConfig = {
        ...catalogConfig,
        categoryAttributeValues: {
          ...catalogConfig.categoryAttributeValues,
          [cleanCat]: {
            ...(catalogConfig.categoryAttributeValues?.[cleanCat] || {}),
            [attributeKey]: nextOptions,
          },
        },
      };
      setCatalogConfig(nextConfig);
      persistCatalogConfig(nextConfig);
      return true;
    }

    const duplicate = currentAttr.options.find(
      (opt) =>
        !isSameCatalogText(opt, oldOption) && isSameCatalogText(opt, cleanNew)
    );
    if (duplicate) return false;

    const nextOptions = currentAttr.options.map((opt) =>
      isSameCatalogText(opt, oldOption) ? cleanNew : opt
    );

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      attributes: {
        ...catalogConfig.attributes,
        [attributeKey]: {
          ...currentAttr,
          options: nextOptions,
        },
      },
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
    return true;
  };

  const deleteAttributeOption = (
    attributeKey: string,
    optionToRemove: string,
    categoryName?: ProductCategory
  ) => {
    const currentAttr = catalogConfig.attributes[attributeKey];
    if (!currentAttr) return;

    if (categoryName) {
      const currentOpts = getEffectiveAttributeOptions(
        catalogConfig,
        categoryName,
        attributeKey
      );
      const nextOptions = currentOpts.filter(
        (opt) => !isSameCatalogText(opt, optionToRemove)
      );

      const cleanCat = normalizeCatalogText(categoryName);
      const nextConfig: CatalogConfig = {
        ...catalogConfig,
        categoryAttributeValues: {
          ...catalogConfig.categoryAttributeValues,
          [cleanCat]: {
            ...(catalogConfig.categoryAttributeValues?.[cleanCat] || {}),
            [attributeKey]: nextOptions,
          },
        },
      };
      setCatalogConfig(nextConfig);
      persistCatalogConfig(nextConfig);
      return;
    }

    if (currentAttr.options.length <= 1) return;

    const nextOptions = currentAttr.options.filter(
      (opt) => !isSameCatalogText(opt, optionToRemove)
    );
    if (nextOptions.length === 0) return;

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      attributes: {
        ...catalogConfig.attributes,
        [attributeKey]: {
          ...currentAttr,
          options: nextOptions,
        },
      },
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
  };

  const reorderAttributeOptions = (
    attributeKey: string,
    newOptions: string[],
    categoryName?: ProductCategory
  ) => {
    const currentAttr = catalogConfig.attributes[attributeKey];
    if (!currentAttr) return;

    const cleanOptions: string[] = [];
    for (const rawOpt of newOptions) {
      const norm = normalizeCatalogText(rawOpt);
      if (norm && !cleanOptions.some((o) => isSameCatalogText(o, norm))) {
        cleanOptions.push(norm);
      }
    }
    if (cleanOptions.length === 0) return;

    if (categoryName) {
      const cleanCat = normalizeCatalogText(categoryName);
      const nextConfig: CatalogConfig = {
        ...catalogConfig,
        categoryAttributeValues: {
          ...catalogConfig.categoryAttributeValues,
          [cleanCat]: {
            ...(catalogConfig.categoryAttributeValues?.[cleanCat] || {}),
            [attributeKey]: cleanOptions,
          },
        },
      };
      setCatalogConfig(nextConfig);
      persistCatalogConfig(nextConfig);
      return;
    }

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      attributes: {
        ...catalogConfig.attributes,
        [attributeKey]: {
          ...currentAttr,
          options: cleanOptions,
        },
      },
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
  };

  const resetCategoryAttributeOptionsToGlobal = (
    categoryName: ProductCategory,
    attributeKey: string
  ) => {
    const cleanCat = normalizeCatalogText(categoryName);
    if (!catalogConfig.categoryAttributeValues?.[cleanCat]) return;

    const nextCatValues = {
      ...catalogConfig.categoryAttributeValues[cleanCat],
    };
    delete nextCatValues[attributeKey];

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      categoryAttributeValues: {
        ...catalogConfig.categoryAttributeValues,
        [cleanCat]: nextCatValues,
      },
    };
    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
  };

  const createCustomAttribute = (
    label: string,
    initialOptions: string[] = []
  ): string | null => {
    const cleanLabel = normalizeCatalogText(label);
    if (!cleanLabel) return null;

    const existingEntry = Object.values(catalogConfig.attributes).find((attr) =>
      isSameCatalogText(attr.label, cleanLabel)
    );
    if (existingEntry) return existingEntry.key;

    const key =
      "custom_" +
      cleanLabel
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") +
      "_" +
      Date.now().toString(36).slice(-4);

    const cleanOptions: string[] = [];
    for (const rawOpt of initialOptions) {
      const norm = normalizeCatalogText(rawOpt);
      if (norm && !cleanOptions.some((o) => isSameCatalogText(o, norm))) {
        cleanOptions.push(norm);
      }
    }
    if (cleanOptions.length === 0) {
      cleanOptions.push("Estándar");
    }

    const nextConfig: CatalogConfig = {
      ...catalogConfig,
      attributes: {
        ...catalogConfig.attributes,
        [key]: {
          key,
          label: cleanLabel,
          options: cleanOptions,
        },
      },
    };

    setCatalogConfig(nextConfig);
    persistCatalogConfig(nextConfig);
    return key;
  };

  const resetCatalogConfigToDefault = () => {
    const fresh = structuredCloneConfig(DEFAULT_CATALOG_CONFIG);
    setCatalogConfig(fresh);
    persistCatalogConfig(fresh);
  };

  // Carrito de compras
  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;
    const existing = cart.find((i) => i.productId === productId);
    const batch = product.batches
      .filter((b) => b.stock > 0)
      .sort((a, b) => b.stock - a.stock)[0];
    if (!batch) return false;

    if (existing) {
      const active = product.batches.find((b) => b.id === existing.batchId);
      if (!active || existing.quantity >= active.stock) return false;
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        { productId, batchId: batch.id, quantity: 1, unitPrice: product.price },
      ]);
    }
    return true;
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.productId === productId);
    const product = products.find((p) => p.id === productId);
    const stock =
      product?.batches.find((b) => b.id === item?.batchId)?.stock ?? 0;
    const next = Math.min(Math.max(0, Math.floor(quantity)), stock);
    setCart((prev) =>
      next === 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId ? { ...i, quantity: next } : i
          )
    );
  };

  const updateCartItemPrice = (productId: string, unitPrice: number) => {
    if (Number.isFinite(unitPrice) && unitPrice >= 0) {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, unitPrice: Math.round(unitPrice) }
            : i
        )
      );
    }
  };

  const updateCartItemBatch = (productId: string, batchId: string) => {
    const product = products.find((p) => p.id === productId);
    const batch = product?.batches.find((b) => b.id === batchId);
    if (!batch || batch.stock <= 0) return;
    setLastSelectedSupplierId(batch.supplierId);
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, batchId, quantity: Math.min(i.quantity, batch.stock) }
          : i
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setCart([]);

  // Ventas: Concurrencia, Candado Anti-Duplicados y RPC Atómico
  const completeSale = (
    paymentMethod: PaymentMethod,
    total: number,
    customerName?: string
  ) => {
    if (saleInFlightRef.current) return false;
    const cartSnapshot = [...cart];
    const subtotal = cartSnapshot.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    if (
      !cartSnapshot.length ||
      !Number.isFinite(total) ||
      total < 0 ||
      total > subtotal
    ) {
      return false;
    }

    saleInFlightRef.current = true;
    try {
      const maxSaleNumber = sales.reduce(
        (max, s) =>
          Math.max(max, typeof s.saleNumber === "number" ? s.saleNumber : 0),
        0
      );
      const nextNumber = maxSaleNumber > 0 ? maxSaleNumber + 1 : 1;

      const saleItems: SaleItem[] = cartSnapshot.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const batch = product?.batches.find((b) => b.id === item.batchId);
        return {
          id: makeId("item"),
          productId: item.productId,
          productName: product?.name ?? "Producto",
          qty: item.quantity,
          unitPrice: item.unitPrice,
          unitCostSnapshot: batch?.cost ?? 0,
          batchId: item.batchId,
          warrantyDays: product?.warrantyDays ?? 30,
          warrantyClaimed: false,
        };
      });

      const newSale: Sale = {
        id: makeId("sale"),
        saleNumber: nextNumber,
        customerName: customerName?.trim() || "Cliente General",
        paymentMethod,
        totalAmount: Math.round(total),
        createdAt: new Date().toISOString(),
        items: saleItems,
      };

      // Actualización optimista local deduplicada
      setSales((prev) => {
        const nextList = deduplicateSales([newSale, ...prev]);
        persistDemoSales(nextList);
        return nextList;
      });

      setProducts((prev) =>
        prev.map((p) => {
          const item = cartSnapshot.find((i) => i.productId === p.id);
          if (!item) return p;
          return {
            ...p,
            batches: p.batches.map((b) =>
              b.id === item.batchId
                ? { ...b, stock: Math.max(0, b.stock - item.quantity) }
                : b
            ),
          };
        })
      );
      setCart([]);

      // Transacción atómica en Supabase si está conectado (con fallback a Dexie IndexedDB si está offline)
      if (storeId && !isDemoUser) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          void enqueueOfflineSale(storeId, newSale, cartSnapshot);
          report(
            "Venta registrada localmente (Modo Offline). Se sincronizará automáticamente al volver la red."
          );
        } else {
          void executeCompleteSaleRpc(storeId, newSale, cartSnapshot).catch(
            (err: unknown) => {
              // Si el RPC falla por corte de red o timeout, encolar en Dexie para sincronización idempotente
              void enqueueOfflineSale(storeId, newSale, cartSnapshot);
              const msg = err instanceof Error ? err.message : String(err);
              report(`Venta guardada localmente (Modo Offline): ${msg}`);
            }
          );
        }
      }

      return true;
    } finally {
      setTimeout(() => {
        saleInFlightRef.current = false;
      }, 250);
    }
  };

  // Modificar Venta existente (CRUD Historial) con reconciliación de inventario
  const updateSale = (updatedSale: Sale) => {
    const prevSale = sales.find((s) => s.id === updatedSale.id);
    if (!prevSale) return;

    const cleanSale: Sale = {
      ...updatedSale,
      customerName: updatedSale.customerName.trim() || "Cliente General",
      totalAmount: Math.max(0, Math.round(updatedSale.totalAmount)),
      items: updatedSale.items.map((it) => ({
        ...it,
        qty: Math.max(1, Math.floor(it.qty)),
        unitPrice: Math.max(0, Math.round(it.unitPrice)),
      })),
    };

    // Reconciliar diferencias de stock si cambiaron las cantidades o los ítems
    const stockAdjustments = new Map<string, number>(); // key: `${productId}::${batchId}` -> delta a sumar al stock
    for (const oldItem of prevSale.items) {
      const key = `${oldItem.productId}::${oldItem.batchId}`;
      stockAdjustments.set(key, (stockAdjustments.get(key) ?? 0) + oldItem.qty);
    }
    for (const newItem of cleanSale.items) {
      const key = `${newItem.productId}::${newItem.batchId}`;
      stockAdjustments.set(key, (stockAdjustments.get(key) ?? 0) - newItem.qty);
    }

    const modifiedProducts: Product[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        let changed = false;
        const nextBatches = prod.batches.map((b) => {
          const delta = stockAdjustments.get(`${prod.id}::${b.id}`) ?? 0;
          if (delta !== 0) {
            changed = true;
            return { ...b, stock: Math.max(0, b.stock + delta) };
          }
          return b;
        });
        if (changed) {
          const updatedProd = normalizedProduct({
            ...prod,
            batches: nextBatches,
          });
          modifiedProducts.push(updatedProd);
          return updatedProd;
        }
        return prod;
      })
    );

    for (const mp of modifiedProducts) {
      void persist("products", mp).catch((err: unknown) => {
        report(err instanceof Error ? err.message : String(err));
      });
    }

    setSales((prev) => {
      const nextList = prev.map((s) => (s.id === cleanSale.id ? cleanSale : s));
      persistDemoSales(nextList);
      return nextList;
    });

    void persist("sales", cleanSale).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
  };

  // Eliminar Venta existente (CRUD Historial) con restitución opcional de stock
  const deleteSale = (saleId: string, restoreStock = true) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    if (restoreStock && targetSale.items.length > 0) {
      const modifiedProducts: Product[] = [];
      setProducts((prev) =>
        prev.map((prod) => {
          const matchingItems = targetSale.items.filter(
            (it) => it.productId === prod.id
          );
          if (matchingItems.length === 0) return prod;

          const nextBatches = prod.batches.map((b) => ({ ...b }));
          for (const item of matchingItems) {
            const targetBatch =
              nextBatches.find((b) => b.id === item.batchId) ?? nextBatches[0];
            if (targetBatch) {
              targetBatch.stock = Math.max(0, targetBatch.stock + item.qty);
            }
          }

          const updatedProd = normalizedProduct({
            ...prod,
            batches: nextBatches,
          });
          modifiedProducts.push(updatedProd);
          return updatedProd;
        })
      );

      for (const mp of modifiedProducts) {
        void persist("products", mp).catch((err: unknown) => {
          report(err instanceof Error ? err.message : String(err));
        });
      }
    }

    setSales((prev) => {
      const nextList = prev.filter((s) => s.id !== saleId);
      persistDemoSales(nextList);
      return nextList;
    });

    if (storeId && !isDemoUser) {
      void deleteSaleRecord(storeId, saleId).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        report(`Fallo al eliminar venta: ${msg}`);
      });
    }
  };

  const toggleItemWarranty = (
    saleId: string,
    itemId: string,
    note?: string
  ) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    const updatedSale: Sale = {
      ...sale,
      items: sale.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              warrantyClaimed: !i.warrantyClaimed,
              warrantyClaimNote:
                note !== undefined ? note : i.warrantyClaimNote,
            }
          : i
      ),
    };

    setSales((prev) => {
      const nextList = prev.map((s) => (s.id === saleId ? updatedSale : s));
      persistDemoSales(nextList);
      return nextList;
    });
    void persist("sales", updatedSale).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
  };

  const createClosure = (
    data: Omit<Closure, "id" | "closedAt"> & { id?: string; closedAt?: string }
  ) => {
    const value: Closure = {
      ...data,
      id: data.id ?? makeId("cycle"),
      closedAt: data.closedAt ?? new Date().toISOString(),
    };
    setClosures((prev) => [value, ...prev]);
    void persist("cycle_closings", value).catch((err: unknown) => {
      report(err instanceof Error ? err.message : String(err));
    });
  };

  const updateStoreProfile = async (updates: {
    storeName: string;
    storePhone?: string;
    storeAddress?: string;
    storeLogoUrl?: string;
    accentPalette?: AccentPaletteId;
  }) => {
    if (!userProfile) return;
    const cleanName = updates.storeName.trim() || userProfile.storeName;
    const cleanPhone = updates.storePhone?.trim();
    const cleanAddress = updates.storeAddress?.trim();
    const cleanLogo = updates.storeLogoUrl;
    const cleanPalette = updates.accentPalette || accentPalette;

    if (updates.accentPalette) {
      setAccentPalette(updates.accentPalette);
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      storeName: cleanName,
      storePhone: cleanPhone,
      storeAddress: cleanAddress,
      storeLogoUrl: cleanLogo,
      accentPalette: cleanPalette,
    };

    setUserProfile(updatedProfile);

    try {
      localStorage.setItem(
        `quiral_store_profile_${userProfile.storeId}`,
        JSON.stringify({
          storeName: cleanName,
          storePhone: cleanPhone,
          storeAddress: cleanAddress,
          storeLogoUrl: cleanLogo,
          accentPalette: cleanPalette,
        })
      );
    } catch (err) {
      console.warn("Error guardando perfil de tienda en localStorage:", err);
    }

    if (!isDemoUser && userProfile.storeId) {
      try {
        await updateStoreNameRecord(userProfile.storeId, cleanName);
      } catch (dbErr) {
        console.warn("Aviso al actualizar tabla stores:", dbErr);
      }
    }
  };

  const signOut = async () => {
    await signOutUser();
    setUserProfile(null);
    setStoreId(null);
    setIsDemoUser(false);
    lastLoadedUserIdRef.current = null;
    lastLoadedStoreIdRef.current = null;
    setSuppliers([]);
    setProducts([]);
    setSales([]);
    setClosures([]);
  };

  const refreshData = useCallback(async () => {
    if (storeId) {
      await loadData(storeId, isDemoUser);
    } else {
      await syncUserSession();
    }
  }, [storeId, isDemoUser, loadData, syncUserSession]);

  return (
    <InventoryContext.Provider
      value={{
        suppliers,
        products,
        sales,
        closures,
        loading,
        error,
        userProfile,
        isDemoUser,
        showCosts,
        setShowCosts,
        selectedProduct,
        setSelectedProduct,
        isNewProductModalOpen,
        setIsNewProductModalOpen,
        isPurgeModalOpen,
        setIsPurgeModalOpen,
        lastSelectedSupplierId,
        setLastSelectedSupplierId,
        cart,
        cartUnits,
        addToCart,
        updateCartQuantity,
        updateCartItemPrice,
        updateCartItemBatch,
        removeFromCart,
        clearCart,
        completeSale,
        updateSale,
        deleteSale,
        createClosure,
        toggleItemWarranty,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplier,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustBatchStock,
        adjustMasterStock,
        addBatchToProduct,
        updateProductPrice,
        accentPalette,
        setAccentPalette,
        updateStoreProfile,
        purgeOutOfStock,
        deleteMultipleProducts,
        clearAllProducts,
        catalogConfig,
        updateCategoryOrder,
        addCategory,
        deleteCategory,
        updateCategoryAttributes,
        addAttributeOption,
        renameAttributeOption,
        deleteAttributeOption,
        reorderAttributeOptions,
        resetCategoryAttributeOptionsToGlobal,
        createCustomAttribute,
        resetCatalogConfigToDefault,
        signOut,
        refreshData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error(
      "useInventory debe utilizarse dentro de un InventoryProvider"
    );
  }
  return ctx;
}
