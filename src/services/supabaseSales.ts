import { logDbEvent, supabase, SUPABASE_PAGE_SIZE, withDbTelemetry } from "../lib/supabase";
import { CartItem, Closure, Sale } from "../types/domain";

export interface StoreSalesBundle {
  sales: Sale[];
  closures: Closure[];
}

/**
 * Carga el paquete de ventas e historial de cierres de ciclo para la tienda activa.
 */
export async function fetchStoreSalesBundle(storeId: string): Promise<StoreSalesBundle> {
  const [salesRes, closuresRes] = await withDbTelemetry("load_store_sales", storeId, () =>
    Promise.all([
      supabase
        .from("sales")
        .select("data")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(SUPABASE_PAGE_SIZE),
      supabase
        .from("cycle_closings")
        .select("data")
        .eq("store_id", storeId)
        .order("closed_at", { ascending: false })
        .limit(SUPABASE_PAGE_SIZE),
    ])
  );

  if (salesRes.error) {
    logDbEvent("error", "fetch_sales_failed", { storeId, details: salesRes.error.message });
    throw salesRes.error;
  }
  if (closuresRes.error) {
    logDbEvent("error", "fetch_closures_failed", { storeId, details: closuresRes.error.message });
    throw closuresRes.error;
  }

  const sales = (salesRes.data?.map((r) => r.data as Sale) ?? []).filter(Boolean);
  const closures = (closuresRes.data?.map((r) => r.data as Closure) ?? []).filter(Boolean);

  return { sales, closures };
}

/**
 * Pasa a purgar ventas semilla artificiales ("demo-sale-*") en segundo plano
 * si llegaron a sincronizarse en la base de datos de producción.
 */
export async function purgeLegacySeededSales(storeId: string): Promise<void> {
  try {
    await supabase
      .from("sales")
      .delete()
      .eq("store_id", storeId)
      .like("id", "demo-sale-%");
  } catch (err) {
    logDbEvent("warn", "purge_legacy_seeds_failed", {
      storeId,
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Ejecuta la transacción atómica de venta y descuento de inventario vía RPC en Supabase.
 */
export async function executeCompleteSaleRpc(
  storeId: string,
  sale: Sale,
  lines: CartItem[]
): Promise<void> {
  const { error } = await supabase.rpc("complete_sale", {
    target_store: storeId,
    sale_id: sale.id,
    sale_number: sale.saleNumber,
    sale_created_at: sale.createdAt,
    sale_data: sale,
    lines,
  });

  if (error) {
    logDbEvent("error", "rpc_complete_sale_failed", {
      storeId,
      details: `saleId=${sale.id}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Persiste o actualiza un registro de venta en la tabla `sales`.
 */
export async function persistSaleRecord(storeId: string, sale: Sale): Promise<void> {
  const payload = {
    store_id: storeId,
    id: sale.id,
    sale_number: sale.saleNumber,
    created_at: sale.createdAt,
    data: sale,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withDbTelemetry("upsert_sales", storeId, () =>
    supabase.from("sales").upsert(payload)
  );

  if (error) {
    logDbEvent("error", "upsert_sale_failed", {
      storeId,
      details: `saleId=${sale.id}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Elimina una venta por ID en Supabase.
 */
export async function deleteSaleRecord(storeId: string, saleId: string): Promise<void> {
  const { error } = await supabase
    .from("sales")
    .delete()
    .eq("store_id", storeId)
    .eq("id", saleId);

  if (error) {
    logDbEvent("error", "delete_sale_failed", {
      storeId,
      details: `saleId=${saleId}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Persiste un cierre de ciclo en la tabla `cycle_closings`.
 */
export async function persistClosureRecord(storeId: string, closure: Closure): Promise<void> {
  const payload = {
    store_id: storeId,
    id: closure.id,
    closed_at: closure.closedAt,
    data: closure,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withDbTelemetry("upsert_cycle_closings", storeId, () =>
    supabase.from("cycle_closings").upsert(payload)
  );

  if (error) {
    logDbEvent("error", "upsert_closure_failed", {
      storeId,
      details: `closureId=${closure.id}: ${error.message}`,
    });
    throw error;
  }
}
