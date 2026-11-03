import { logDbEvent, supabase } from "../lib/supabase";
import { Closure, Product, Sale, Supplier } from "../types/domain";

export interface RealtimeHandlers {
  onSupplierInsert?: (supplier: Supplier) => void;
  onSupplierUpdate?: (supplier: Supplier) => void;
  onSupplierDelete?: (supplierId: string) => void;

  onProductInsert?: (product: Product) => void;
  onProductUpdate?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;

  onSaleInsert?: (sale: Sale) => void;
  onSaleUpdate?: (sale: Sale) => void;
  onSaleDelete?: (saleId: string) => void;

  onClosureInsert?: (closure: Closure) => void;
  onClosureUpdate?: (closure: Closure) => void;
  onClosureDelete?: (closureId: string) => void;
}

/**
 * Suscribe a cambios concurrentes de Supabase Realtime para una tienda dada
 * y devuelve una función de desuscripción limpia.
 */
export function subscribeToStoreRealtime(
  storeId: string,
  handlers: RealtimeHandlers
): () => void {
  const channel = supabase
    .channel(`realtime:store:${storeId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "suppliers", filter: `store_id=eq.${storeId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const rowData = payload.new?.data as Supplier;
          if (rowData) handlers.onSupplierInsert?.(rowData);
        } else if (payload.eventType === "UPDATE") {
          const rowData = payload.new?.data as Supplier;
          if (rowData) handlers.onSupplierUpdate?.(rowData);
        } else if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) handlers.onSupplierDelete?.(oldId);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products", filter: `store_id=eq.${storeId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const rowData = payload.new?.data as Product;
          if (rowData) handlers.onProductInsert?.(rowData);
        } else if (payload.eventType === "UPDATE") {
          const rowData = payload.new?.data as Product;
          if (rowData) handlers.onProductUpdate?.(rowData);
        } else if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) handlers.onProductDelete?.(oldId);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales", filter: `store_id=eq.${storeId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const rowData = payload.new?.data as Sale;
          if (rowData && !rowData.id?.startsWith("demo-sale-")) {
            handlers.onSaleInsert?.(rowData);
          }
        } else if (payload.eventType === "UPDATE") {
          const rowData = payload.new?.data as Sale;
          if (rowData) handlers.onSaleUpdate?.(rowData);
        } else if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) handlers.onSaleDelete?.(oldId);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cycle_closings", filter: `store_id=eq.${storeId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const rowData = payload.new?.data as Closure;
          if (rowData) handlers.onClosureInsert?.(rowData);
        } else if (payload.eventType === "UPDATE") {
          const rowData = payload.new?.data as Closure;
          if (rowData) handlers.onClosureUpdate?.(rowData);
        } else if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) handlers.onClosureDelete?.(oldId);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        logDbEvent("warn", `realtime_${status.toLowerCase()}`, {
          storeId,
          details: err ? String(err) : status,
        });
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
