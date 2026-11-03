---
name: quiral-pos-engine
description: >-
  Estándares de arquitectura de datos, estado global (InventoryContext), Supabase PostgreSQL Best Practices (RLS, RPCs atómicos, FOR UPDATE),
  arquitectura Offline-First (TanStack Query + Dexie.js), CRUD de historial de ventas y gestión de inventario multi-lote para Quiral POS.
  Úsalo al modificar lógica de catálogo, balanceo de stock, sincronización offline/online, RPCs de venta (complete_sale), deduplicación y formateo COP.
---

# Quiral POS Engine & State Architecture Skill

Esta Skill establece las directivas técnicas de ingeniería para la gestión del estado global, las mutaciones de base de datos en Supabase (PostgreSQL), la arquitectura **Offline-First (TanStack Query + Dexie.js)**, el CRUD de ventas y la integridad transaccional multi-tenant en **Quiral POS (`quiral-pwa@1.0.1`)**.

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI Y PROTECCIÓN DE VENTAS

1. **Inmunidad de Layout Base:** Ningún cambio en la lógica de negocio puede alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de forma que afecte el `safe-area-inset-top`, el `backdrop-blur` o los márgenes "edge-to-edge" de iOS.
2. **Prohibición de Semillas Masivas de Ventas (Serie 1000+):** Queda prohibido generar o inyectar las 118 ventas artificiales (`demo-sale-1..118`) en `demoSeed.ts` o invocar `seed_demo_store` automáticamente al iniciar sesión. `deduplicateSales` filtra cualquier registro `demo-sale-*` heredado y garantiza unicidad por `id` y `saleNumber`.

---

## 1. Principios de Integridad de Datos y Supabase Best Practices

1. **Fuente de Verdad Única:**
   PostgreSQL en Supabase es la fuente de verdad persistente en la nube. El estado en `InventoryContext` y Dexie.js actúa como réplica local ultra-rápida y resiliente.
2. **Aislamiento Multi-Tenant Estricto:**
   Toda consulta o mutación debe incluir `.eq("store_id", storeId)` y someterse a las funciones RLS (`is_store_member(store_id)`).
3. **Buenas Prácticas de RLS (PostgreSQL Security):**
   - **Cláusula `TO` explícita:** Usar `TO authenticated` en vez de la función obsoleta `auth.role() = 'authenticated'`.
   - **Prevención de BOLA / IDOR:** `TO authenticated` por sí solo no protege filas; debe combinarse con predicados de membresía de tienda:
     ```sql
     CREATE POLICY "store_isolation" ON public.sales
     TO authenticated
     USING (auth.uid() IS NOT NULL AND is_store_member(store_id))
     WITH CHECK (auth.uid() IS NOT NULL AND is_store_member(store_id));
     ```
   - **Vistas Seguras:** En PostgreSQL 15+, toda vista debe declararse con `WITH (security_invoker = true)` para evitar que evada las políticas RLS.
   - **Metadatos Confiables:** Jamás utilizar `raw_user_meta_data` (editable por el usuario) en decisiones de autorización o RLS.
4. **Cero Saldo Negativo:**
   Bajo ninguna circunstancia se debe permitir que el stock de un lote o el inventario total descienda de cero.
5. **Snapshotting de Costos:**
   Cada ítem de venta completada debe registrar su costo unitario histórico (`unitCostSnapshot`) y días de garantía para asegurar que los cálculos de utilidad histórica sean inmutables aunque el costo del lote cambie en el futuro.

---

## 2. Arquitectura Offline-First (TanStack Query + Dexie.js)

1. **Caché Inteligente con TanStack Query:**
   - `staleTime`: 5 minutos (`5 * 60 * 1000`) para consultas de catálogo e inventario.
   - `gcTime`: 24 horas (`24 * 60 * 60 * 1000`) para persistencia en memoria local.
   - Mutaciones optimistas inmediatas en UI con reversión automática (`onError`) en caso de fallo crítico.
2. **Persistencia Local con Dexie.js (IndexedDB):**
   - Tablas locales: `products`, `sales`, `pendingMutations`.
   - Si la red cae (`navigator.onLine === false`), las ventas y ajustes de inventario se confirman localmente en Dexie y se encolan en `pendingMutations`.
   - Al recuperar la conectividad (`online` event), el worker de sincronización procesa la cola con reintentos exponenciales y deduplicación por `id`.
3. **Sincronización Realtime:**
   - Suscripción a canales `postgres_changes` filtrados por `store_id`. Al recibir cambios remotos de otros dispositivos de la tienda, se invalidan selectivamente las queries de TanStack Query sin reiniciar el estado local del carrito en curso.

---

## 3. Algoritmo Determinista de Balanceo de Lotes (`adjustMasterStock`)

Al modificar el stock total de un producto desde el control maestro en `ProductDetailModal` o `InventoryContext`:

```typescript
if (delta > 0) {
  const targetBatch = [...product.batches].sort((a, b) => b.stock - a.stock)[0];
  targetBatch.stock += delta;
} else if (delta < 0) {
  const availableBatches = product.batches.filter((b) => b.stock > 0);
  if (availableBatches.length === 0) return;
  const targetBatch = [...availableBatches].sort((a, b) => b.stock - a.stock)[0];
  targetBatch.stock += delta;
}
```

---

## 4. Transacción Comercial Atómica (`completeSale`) y CRUD de Ventas (`updateSale` / `deleteSale`)

1. **Candado Sincrónico Anti-Duplicados (`saleInFlightRef`):**
   `completeSale` bloquea ejecuciones paralelas mediante `saleInFlightRef.current` y calcula `nextNumber` usando el máximo `saleNumber` existente (`Math.max`), deduplicando la lista con `deduplicateSales`.
2. **Persistencia Completa en `public.sales`:**
   Al hacer `upsert` en `public.sales`, siempre se deben incluir las columnas `NOT NULL` de PostgreSQL: `store_id`, `id`, `sale_number`, `created_at`, `data` y `updated_at`.
3. **RPC Atómico de Venta (`complete_sale`):**
   En entornos online, la mutación de inventario y registro de venta se ejecutan mediante RPC con bloqueo pesimista (`FOR UPDATE`) para prevenir condiciones de carrera entre múltiples cajas registradoras simultáneas.
4. **CRUD en Historial (`HistoryView.tsx`):**
   - `updateSale(updatedSale)`: Reconcilia el diferencial de unidades por lote (`oldQty - newQty`) en `products`, actualiza la venta y persiste en Supabase. Requiere confirmación explícita del usuario en el modal.
   - `deleteSale(saleId, restoreStock)`: Restituye opcionalmente las unidades vendidas a sus lotes originales y elimina el registro en Supabase. Requiere Modal de Confirmación obligatorio.

---

## 5. Convenciones de Formateo de Cifras (`src/utils/formatters.ts`)

Utiliza siempre los formateadores centralizados (`formatCOP`, `parseCOPInput`, `formatUnits`, `formatShortDate`, `formatFullDate`) acompañados de la clase `.tabular-nums`.

---

## 6. Verificación de Seguridad y Build (100% Exit 0)

Al finalizar cualquier cambio en la lógica de negocio, esquemas de datos o hooks:
```bash
npx tsc --noEmit
npm run test:unit
npm run build
```
Todos deben concluir con código de salida `0`.
