import { logDbEvent, supabase, SUPABASE_PAGE_SIZE, withDbTelemetry } from "../lib/supabase";
import { CatalogConfig, Product, Supplier } from "../types/domain";

export interface StoreInventoryBundle {
  suppliers: Supplier[];
  products: Product[];
  catalogConfigRaw: unknown | null;
}

/**
 * Carga el paquete de inventario (proveedores, productos, configuración de catálogo)
 * para una tienda específica desde Supabase con telemetría.
 */
export async function fetchStoreInventoryBundle(storeId: string): Promise<StoreInventoryBundle> {
  const [supRes, prodRes, catConfRes] = await withDbTelemetry("load_store_inventory", storeId, () =>
    Promise.all([
      supabase.from("suppliers").select("data").eq("store_id", storeId).limit(SUPABASE_PAGE_SIZE),
      supabase
        .from("products")
        .select("data")
        .eq("store_id", storeId)
        .order("updated_at", { ascending: false })
        .limit(SUPABASE_PAGE_SIZE),
      supabase.from("catalog_configs").select("config").eq("store_id", storeId).maybeSingle(),
    ])
  );

  if (supRes.error) {
    logDbEvent("error", "fetch_suppliers_failed", { storeId, details: supRes.error.message });
    throw supRes.error;
  }
  if (prodRes.error) {
    logDbEvent("error", "fetch_products_failed", { storeId, details: prodRes.error.message });
    throw prodRes.error;
  }

  const suppliers = (supRes.data?.map((r) => r.data as Supplier) ?? []).filter(Boolean);
  const products = (prodRes.data?.map((r) => r.data as Product) ?? []).filter(Boolean);
  const catalogConfigRaw = catConfRes.data?.config ?? null;

  return { suppliers, products, catalogConfigRaw };
}

/**
 * Persiste o actualiza un proveedor en Supabase.
 */
export async function persistSupplierRecord(storeId: string, supplier: Supplier): Promise<void> {
  const payload = {
    store_id: storeId,
    id: supplier.id,
    data: supplier,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withDbTelemetry("upsert_suppliers", storeId, () =>
    supabase.from("suppliers").upsert(payload)
  );

  if (error) {
    logDbEvent("error", "upsert_supplier_failed", {
      storeId,
      details: `supplierId=${supplier.id}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Elimina un proveedor en Supabase.
 */
export async function deleteSupplierRecord(storeId: string, supplierId: string): Promise<void> {
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("store_id", storeId)
    .eq("id", supplierId);

  if (error) {
    logDbEvent("error", "delete_supplier_failed", {
      storeId,
      details: `supplierId=${supplierId}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Persiste o actualiza un producto en Supabase.
 */
export async function persistProductRecord(storeId: string, product: Product): Promise<void> {
  const payload = {
    store_id: storeId,
    id: product.id,
    data: product,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withDbTelemetry("upsert_products", storeId, () =>
    supabase.from("products").upsert(payload)
  );

  if (error) {
    logDbEvent("error", "upsert_product_failed", {
      storeId,
      details: `productId=${product.id}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Elimina un producto en Supabase por ID.
 */
export async function deleteProductRecord(storeId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("store_id", storeId)
    .eq("id", productId);

  if (error) {
    logDbEvent("error", "delete_product_failed", {
      storeId,
      details: `productId=${productId}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Elimina una lista selectiva de productos por sus IDs.
 */
export async function deleteMultipleProductsRecords(
  storeId: string,
  productIds: string[]
): Promise<void> {
  if (!productIds.length) return;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("store_id", storeId)
    .in("id", productIds);

  if (error) {
    logDbEvent("error", "delete_multiple_products_failed", {
      storeId,
      details: `count=${productIds.length}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Elimina todos los productos de la tienda en Supabase (Vaciado total).
 */
export async function deleteAllProductsRecords(storeId: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("store_id", storeId);

  if (error) {
    logDbEvent("error", "delete_all_products_failed", { storeId, details: error.message });
    throw error;
  }
}

/**
 * Purga productos agotados individualmente.
 */
export async function purgeProductsRecords(storeId: string, productIds: string[]): Promise<void> {
  if (!productIds.length) return;

  const results = await Promise.all(
    productIds.map((id) =>
      supabase.from("products").delete().eq("store_id", storeId).eq("id", id)
    )
  );

  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) {
    logDbEvent("error", "purge_products_failed", { storeId, details: firstErr.message });
    throw firstErr;
  }
}

/**
 * Persiste la configuración del catálogo (categorías y atributos) vía RPC atómica
 * con fallback a user_metadata si no existe la función RPC.
 */
export async function persistCatalogConfigRpc(
  storeId: string,
  config: CatalogConfig
): Promise<void> {
  try {
    await withDbTelemetry("upsert_catalog_config", storeId, () =>
      supabase.rpc("upsert_catalog_config", {
        target_store: storeId,
        config_payload: config,
      })
    );
  } catch (rpcErr) {
    // Respaldo de compatibilidad en user metadata
    logDbEvent("warn", "rpc_upsert_catalog_config_fallback", {
      storeId,
      details: rpcErr instanceof Error ? rpcErr.message : String(rpcErr),
    });
    void supabase.auth
      .updateUser({ data: { catalog_config: config } })
      .catch(() => {});
  }
}

/**
 * Actualiza el nombre de la tienda en la tabla `stores`.
 */
export async function updateStoreNameRecord(storeId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from("stores")
    .update({ name: newName })
    .eq("id", storeId);

  if (error) {
    logDbEvent("warn", "update_store_name_failed", { storeId, details: error.message });
    throw error;
  }
}
