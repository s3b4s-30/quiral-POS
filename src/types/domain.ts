export type BaseProductCategory =
  | "Cargadores y Cables"
  | "Forros / Fundas"
  | "Audio / AirPods"
  | "Power Banks / Baterías"
  | "Celulares"
  | "Perfumes"
  | "Streaming"
  | "General / Otros";

export type ProductCategory = BaseProductCategory | (string & {});

export interface AttributeDefinition {
  key: string;
  label: string;
  options: string[];
}

export interface CategoryConfig {
  name: ProductCategory;
  isSystemDefault: boolean;
  /** Claves de los bloques de atributos asociados a esta categoría */
  attributeKeys: string[];
}

export interface CatalogConfig {
  /** Orden personalizado de categorías en la barra de filtros (sin incluir "Todos", que va fijo al inicio) */
  categoryOrder: ProductCategory[];
  /** Definiciones de categorías personalizadas y base con sus atributos vinculados */
  categories: CategoryConfig[];
  /** Banco maestro de atributos libres y editables */
  attributes: Record<string, AttributeDefinition>;
  /** Opciones personalizadas de atributos con scope por categoría: [categoryName][attributeKey] = string[] */
  categoryAttributeValues?: Record<string, Record<string, string[]>>;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  color: string;
}

export interface Batch {
  id: string;
  supplierId: string;
  cost: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subtitle?: string;
  price: number;
  warrantyDays: number;
  batches: Batch[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = "Efectivo" | "Nequi" | "Bancolombia" | "Tarjeta";

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  unitCostSnapshot?: number;
  batchId?: string;
  warrantyDays: number;
  warrantyClaimed?: boolean;
  warrantyClaimNote?: string;
}

export interface Sale {
  id: string;
  saleNumber: number;
  customerName: string;
  note?: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

export interface ClosureTopSellerTx {
  id: string;
  date: string;
  customer: string;
  qty: number;
  price: number;
}

export interface ClosureTopSeller {
  id: string;
  name: string;
  qty: number;
  revenue: number;
  profit: number;
  tx?: ClosureTopSellerTx[];
}

export interface ClosureTopReturned {
  id: string;
  name: string;
  qty: number;
  notes?: string[];
}

export interface Closure {
  id: string;
  periodLabel: string;
  closedAt: string;
  startDate?: string;
  endDate?: string;
  totalSold: number;
  netProfit: number;
  recoveredInvestment?: number;
  remainingStockInvestment?: number;
  expectedCash?: number;
  realCashReported?: number;
  differenceNote?: string;
  topSellers?: ClosureTopSeller[];
  topReturned?: ClosureTopReturned[];
}

export interface StoreProfile {
  storeName: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
}

export type AccentPaletteId = "blue" | "emerald" | "purple" | "orange" | "rose";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  storeId: string;
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  storeLogoUrl?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  role: "owner" | "staff";
  isDemoUser?: boolean;
  accentPalette?: AccentPaletteId;
}
