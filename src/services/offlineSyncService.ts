import { useEffect, useState } from "react";
import { executeCompleteSaleRpc } from "./supabaseSales";
import {
  getPendingSales,
  getPendingSalesCount,
  offlineDb,
  QuiralOfflineDatabase,
  removeQueuedSale,
  updateQueuedSaleStatus,
} from "./offlineDb";

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
}

let syncInProgress = false;

/**
 * Procesa la cola de ventas pendientes en IndexedDB y las envía a Supabase de forma atómica e idempotente.
 */
export async function flushSalesQueue(
  storeId: string,
  db: QuiralOfflineDatabase = offlineDb
): Promise<SyncResult> {
  if (!storeId || syncInProgress) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  // Si el navegador reporta estar desconectado, no intentar la sincronización
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  syncInProgress = true;
  let succeeded = 0;
  let failed = 0;

  try {
    const queue = await getPendingSales(storeId, db);
    for (const item of queue) {
      if (!item.queueId) continue;

      try {
        await updateQueuedSaleStatus(item.queueId, "syncing", undefined, db);

        // Envío atómico mediante RPC a Supabase
        await executeCompleteSaleRpc(storeId, item.sale, item.lines);

        // Eliminación de la cola una vez confirmado por Supabase
        await removeQueuedSale(item.queueId, db);
        succeeded++;
      } catch (err: unknown) {
        failed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        await updateQueuedSaleStatus(item.queueId, "failed", errMsg, db);

        // Si el fallo es por desconexión en vuelo, frenar el procesamiento secuencial
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          break;
        }
      }
    }

    return { processed: queue.length, succeeded, failed };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Hook reactivo para monitorear conectividad y estado de la cola de sincronización offline.
 */
export function useNetworkSync(
  storeId?: string,
  db: QuiralOfflineDatabase = offlineDb
) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Actualizar conteo de elementos pendientes en Dexie
  const refreshPendingCount = async () => {
    try {
      const count = await getPendingSalesCount(storeId, db);
      setPendingCount(count);
    } catch {
      // Ignorar errores en entornos sin IndexedDB
    }
  };

  // Disparar sincronización manual o automática
  const triggerSync = async () => {
    if (!storeId || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushSalesQueue(storeId, db);
      if (res.succeeded > 0) {
        setLastSyncTime(new Date());
      }
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Al recuperar conexión, sincronizar inmediatamente la cola acumulada
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Intervalo de comprobación cada 30 segundos si hay elementos pendientes
    const interval = setInterval(() => {
      if (isOnline && storeId) {
        refreshPendingCount();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [storeId, isOnline]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncNow: triggerSync,
    refreshPendingCount,
  };
}
