import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient, queryKeys } from "../lib/queryClient";
import {
  cacheCatalogSnapshot,
  cacheSuppliersSnapshot,
  enqueueOfflineSale,
  getCachedCatalogSnapshot,
  getCachedSuppliersSnapshot,
  getPendingSales,
  getPendingSalesCount,
  QuiralOfflineDatabase,
  removeQueuedSale,
  updateQueuedSaleStatus,
} from "../services/offlineDb";
import { flushSalesQueue } from "../services/offlineSyncService";
import * as supabaseSalesModule from "../services/supabaseSales";
import { CartItem, Product, Sale, Supplier } from "../types/domain";

describe("Arquitectura Offline-First y Sincronización en Segundo Plano (Fase 4)", () => {
  let testDb: QuiralOfflineDatabase;
  const testStoreId = "store-offline-test-123";

  const sampleSale: Sale = {
    id: "sale-offline-001",
    saleNumber: 45,
    customerName: "Cliente Offline",
    paymentMethod: "Efectivo",
    totalAmount: 185000,
    createdAt: "2026-11-03T10:00:00.000Z",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Cubo iPhone 20W",
        qty: 1,
        unitPrice: 85000,
        unitCostSnapshot: 42000,
        batchId: "batch-1",
        warrantyDays: 30,
        warrantyClaimed: false,
      },
    ],
  };

  const sampleLines: CartItem[] = [
    {
      productId: "prod-1",
      batchId: "batch-1",
      quantity: 1,
      unitPrice: 85000,
    },
  ];

  const sampleProducts: Product[] = [
    {
      id: "prod-1",
      name: "Cubo iPhone 20W",
      category: "Cargadores y Cables",
      price: 85000,
      warrantyDays: 30,
      batches: [{ id: "batch-1", supplierId: "sup-1", cost: 42000, stock: 15 }],
      createdAt: "2026-11-01T00:00:00.000Z",
    },
  ];

  const sampleSuppliers: Supplier[] = [
    {
      id: "sup-1",
      name: "Distribuidora Tech",
      phone: "+57 300 123 4567",
      color: "#007AFF",
    },
  ];

  beforeEach(async () => {
    // Instanciar base de datos aislada con nombre único para cada prueba
    testDb = new QuiralOfflineDatabase(
      `Quiral_Test_DB_${Date.now()}_${Math.random()}`
    );
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
    vi.restoreAllMocks();
  });

  describe("1. Cola Local de Ventas en IndexedDB (Dexie)", () => {
    it("debe encolar una venta offline con estado 'pending' y atributos completos", async () => {
      const queueId = await enqueueOfflineSale(
        testStoreId,
        sampleSale,
        sampleLines,
        testDb
      );
      expect(queueId).toBeDefined();

      const count = await getPendingSalesCount(testStoreId, testDb);
      expect(count).toBe(1);

      const pendingList = await getPendingSales(testStoreId, testDb);
      expect(pendingList).toHaveLength(1);
      expect(pendingList[0].id).toBe(sampleSale.id);
      expect(pendingList[0].status).toBe("pending");
      expect(pendingList[0].sale.totalAmount).toBe(185000);
      expect(pendingList[0].lines).toHaveLength(1);
    });

    it("debe recuperar ventas en orden FIFO según la fecha de creación", async () => {
      const saleA: Sale = {
        ...sampleSale,
        id: "sale-a",
        createdAt: "2026-11-03T09:00:00.000Z",
      };
      const saleB: Sale = {
        ...sampleSale,
        id: "sale-b",
        createdAt: "2026-11-03T10:00:00.000Z",
      };
      const saleC: Sale = {
        ...sampleSale,
        id: "sale-c",
        createdAt: "2026-11-03T08:00:00.000Z",
      };

      await enqueueOfflineSale(testStoreId, saleA, sampleLines, testDb);
      await enqueueOfflineSale(testStoreId, saleB, sampleLines, testDb);
      await enqueueOfflineSale(testStoreId, saleC, sampleLines, testDb);

      const pending = await getPendingSales(testStoreId, testDb);
      expect(pending).toHaveLength(3);
      // El orden debe ser saleC (08:00), saleA (09:00), saleB (10:00)
      expect(pending[0].id).toBe("sale-c");
      expect(pending[1].id).toBe("sale-a");
      expect(pending[2].id).toBe("sale-b");
    });

    it("debe actualizar el estado a 'failed' e incrementar los intentos al fallar", async () => {
      const queueId = await enqueueOfflineSale(
        testStoreId,
        sampleSale,
        sampleLines,
        testDb
      );
      await updateQueuedSaleStatus(
        queueId,
        "failed",
        "Fallo de conexión 503",
        testDb
      );

      const record = await testDb.salesQueue.get(queueId);
      expect(record?.status).toBe("failed");
      expect(record?.lastError).toBe("Fallo de conexión 503");
      expect(record?.attempts).toBe(1);
    });

    it("debe eliminar de la cola una venta una vez sincronizada", async () => {
      const queueId = await enqueueOfflineSale(
        testStoreId,
        sampleSale,
        sampleLines,
        testDb
      );
      await removeQueuedSale(queueId, testDb);

      const count = await getPendingSalesCount(testStoreId, testDb);
      expect(count).toBe(0);
    });
  });

  describe("2. Instantáneas Locales de Catálogo y Proveedores (Snapshots)", () => {
    it("debe guardar y recuperar la instantánea de catálogo de forma determinista", async () => {
      await cacheCatalogSnapshot(testStoreId, sampleProducts, testDb);

      const cached = await getCachedCatalogSnapshot(testStoreId, testDb);
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe("prod-1");
      expect(cached[0].name).toBe("Cubo iPhone 20W");
      expect(cached[0].batches[0].stock).toBe(15);
    });

    it("debe guardar y recuperar la instantánea de proveedores", async () => {
      await cacheSuppliersSnapshot(testStoreId, sampleSuppliers, testDb);

      const cached = await getCachedSuppliersSnapshot(testStoreId, testDb);
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe("sup-1");
      expect(cached[0].name).toBe("Distribuidora Tech");
    });
  });

  describe("3. Motor de Sincronización en Segundo Plano (flushSalesQueue)", () => {
    it("debe enviar ventas encoladas mediante RPC y vaciar la cola al completar", async () => {
      const rpcSpy = vi
        .spyOn(supabaseSalesModule, "executeCompleteSaleRpc")
        .mockResolvedValueOnce(undefined);

      await enqueueOfflineSale(testStoreId, sampleSale, sampleLines, testDb);

      const result = await flushSalesQueue(testStoreId, testDb);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(rpcSpy).toHaveBeenCalledTimes(1);

      const remaining = await getPendingSalesCount(testStoreId, testDb);
      expect(remaining).toBe(0);
    });

    it("debe abortar la sincronización sin errores si el navegador reporta estar offline", async () => {
      const rpcSpy = vi.spyOn(supabaseSalesModule, "executeCompleteSaleRpc");
      vi.stubGlobal("navigator", { onLine: false });

      await enqueueOfflineSale(testStoreId, sampleSale, sampleLines, testDb);

      const result = await flushSalesQueue(testStoreId, testDb);

      expect(result.processed).toBe(0);
      expect(rpcSpy).not.toHaveBeenCalled();

      // La venta debe continuar en la cola
      const remaining = await getPendingSalesCount(testStoreId, testDb);
      expect(remaining).toBe(1);

      vi.unstubAllGlobals();
    });
  });

  describe("4. Configuración de TanStack Query (Políticas de Caché)", () => {
    it("debe tener configurado staleTime de 5 minutos y gcTime de 30 minutos", () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
      expect(defaultOptions.queries?.gcTime).toBe(30 * 60 * 1000);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("la fábrica de llaves queryKeys debe generar identificadores estables y únicos", () => {
      expect(queryKeys.catalog("store-1")).toEqual(["catalog", "store-1"]);
      expect(queryKeys.sales("store-1")).toEqual(["sales", "store-1"]);
      expect(queryKeys.suppliers("store-1")).toEqual(["suppliers", "store-1"]);
    });
  });
});
