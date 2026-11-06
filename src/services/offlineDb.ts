import Dexie, { type Table } from "dexie";
import { CartItem, Product, Sale, Supplier } from "../types/domain";

/**
 * Registro de una venta en cola pendiente de sincronización con Supabase.
 */
export interface QueuedSale {
  queueId?: number;
  id: string;
  storeId: string;
  sale: Sale;
  lines: CartItem[];
  createdAt: string;
  attempts: number;
  status: "pending" | "syncing" | "failed";
  lastError?: string;
}

/**
 * Instantánea local de producto para recuperación offline.
 */
export interface CachedProductRecord {
  id: string;
  storeId: string;
  data: Product;
  updatedAt: string;
}

/**
 * Instantánea local de proveedor para visualización offline.
 */
export interface CachedSupplierRecord {
  id: string;
  storeId: string;
  data: Supplier;
  updatedAt: string;
}

/**
 * Base de datos local IndexedDB impulsada por Dexie.js para Quiral POS.
 * Asegura tolerancia absoluta ante cortes de red y continuidad operativa de caja.
 */
export class QuiralOfflineDatabase extends Dexie {
  salesQueue!: Table<QueuedSale, number>;
  cachedProducts!: Table<CachedProductRecord, string>;
  cachedSuppliers!: Table<CachedSupplierRecord, string>;

  constructor(databaseName = "QuiralPOS_Offline_DB") {
    super(databaseName);
    this.version(1).stores({
      salesQueue: "++queueId, id, storeId, status, createdAt",
      cachedProducts: "id, storeId, updatedAt",
      cachedSuppliers: "id, storeId, updatedAt",
    });
  }
}

/** Instancia singleton de la base de datos local */
export const offlineDb = new QuiralOfflineDatabase();

/**
 * Encola una venta en la cola local de Dexie para su sincronización asíncrona.
 */
export async function enqueueOfflineSale(
  storeId: string,
  sale: Sale,
  lines: CartItem[],
  db: QuiralOfflineDatabase = offlineDb
): Promise<number> {
  const queuedRecord: QueuedSale = {
    id: sale.id,
    storeId,
    sale,
    lines,
    createdAt: sale.createdAt || new Date().toISOString(),
    attempts: 0,
    status: "pending",
  };

  const id = await db.salesQueue.add(queuedRecord);
  return id;
}

/**
 * Obtiene el conteo de ventas pendientes por sincronizar en la tienda dada.
 */
export async function getPendingSalesCount(
  storeId?: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<number> {
  if (storeId) {
    return await db.salesQueue
      .where("storeId")
      .equals(storeId)
      .and((r) => r.status === "pending" || r.status === "failed")
      .count();
  }
  return await db.salesQueue
    .filter((r) => r.status === "pending" || r.status === "failed")
    .count();
}

/**
 * Obtiene las ventas encoladas en orden cronológico ascendente (FIFO).
 */
export async function getPendingSales(
  storeId: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<QueuedSale[]> {
  return await db.salesQueue
    .where("storeId")
    .equals(storeId)
    .and((r) => r.status !== "syncing")
    .sortBy("createdAt");
}

/**
 * Elimina una venta procesada con éxito de la cola.
 */
export async function removeQueuedSale(
  queueId: number,
  db: QuiralOfflineDatabase = offlineDb
): Promise<void> {
  await db.salesQueue.delete(queueId);
}

/**
 * Actualiza el estado y contador de intentos de una venta en cola.
 */
export async function updateQueuedSaleStatus(
  queueId: number,
  status: QueuedSale["status"],
  error?: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<void> {
  const record = await db.salesQueue.get(queueId);
  if (!record) return;
  await db.salesQueue.update(queueId, {
    status,
    lastError: error,
    attempts: (record.attempts ?? 0) + 1,
  });
}

/**
 * Almacena una instantánea local del catálogo completo en IndexedDB.
 */
export async function cacheCatalogSnapshot(
  storeId: string,
  products: Product[],
  db: QuiralOfflineDatabase = offlineDb
): Promise<void> {
  if (!products.length) return;
  const now = new Date().toISOString();
  const records: CachedProductRecord[] = products.map((prod) => ({
    id: prod.id,
    storeId,
    data: prod,
    updatedAt: now,
  }));

  await db.transaction("rw", db.cachedProducts, async () => {
    await db.cachedProducts.where("storeId").equals(storeId).delete();
    await db.cachedProducts.bulkPut(records);
  });
}

/**
 * Recupera el catálogo cacheado cuando se inicia la app sin conectividad a internet.
 */
export async function getCachedCatalogSnapshot(
  storeId: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<Product[]> {
  const records = await db.cachedProducts
    .where("storeId")
    .equals(storeId)
    .toArray();
  return records.map((r) => r.data);
}

/**
 * Almacena una instantánea local de proveedores en IndexedDB.
 */
export async function cacheSuppliersSnapshot(
  storeId: string,
  suppliers: Supplier[],
  db: QuiralOfflineDatabase = offlineDb
): Promise<void> {
  if (!suppliers.length) return;
  const now = new Date().toISOString();
  const records: CachedSupplierRecord[] = suppliers.map((sup) => ({
    id: sup.id,
    storeId,
    data: sup,
    updatedAt: now,
  }));

  await db.transaction("rw", db.cachedSuppliers, async () => {
    await db.cachedSuppliers.where("storeId").equals(storeId).delete();
    await db.cachedSuppliers.bulkPut(records);
  });
}

/**
 * Recupera los proveedores cacheados localmente.
 */
export async function getCachedSuppliersSnapshot(
  storeId: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<Supplier[]> {
  const records = await db.cachedSuppliers
    .where("storeId")
    .equals(storeId)
    .toArray();
  return records.map((r) => r.data);
}

/**
 * Purga por completo los datos locales en IndexedDB (cola de ventas, catálogo y proveedores)
 * pertenecientes a una tienda específica (ej. al resembrar la cuenta Demo 30/30).
 */
export async function purgeStoreOfflineStorage(
  storeId: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<void> {
  try {
    await db.transaction(
      "rw",
      db.salesQueue,
      db.cachedProducts,
      db.cachedSuppliers,
      async () => {
        await db.salesQueue.where("storeId").equals(storeId).delete();
        await db.cachedProducts.where("storeId").equals(storeId).delete();
        await db.cachedSuppliers.where("storeId").equals(storeId).delete();
      }
    );
  } catch {
    // Entorno sin soporte de IndexedDB o base cerrada
  }
}
