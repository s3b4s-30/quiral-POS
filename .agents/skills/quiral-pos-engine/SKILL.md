---
name: quiral-pos-engine
description: >-
  Estándares de arquitectura de datos, estado global (InventoryContext), transacciones atómicas Supabase, CRUD de
  historial de ventas y gestión de inventario multi-lote para Quiral POS. Úsalo al modificar lógica de catálogo,
  balanceo de stock, RPCs de venta (complete_sale), deduplicación de ventas, sincronización Realtime y formateo COP.
---

# Quiral POS Engine & State Architecture Skill

Esta Skill establece las pautas de ingeniería para la gestión del estado global, las mutaciones de base de datos, el CRUD de ventas y la integridad transaccional en **Quiral POS**.

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI Y PROTECCIÓN DE VENTAS

1. **Inmunidad de Layout Base:** Ningún cambio en la lógica de negocio puede alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de forma que afecte el `safe-area-inset-top`, el `backdrop-blur` o los márgenes "edge-to-edge" de iOS.
2. **Prohibición de Semillas Masivas de Ventas (Serie 1000+):** Queda prohibido generar o inyectar las 118 ventas artificiales (`demo-sale-1..118`) en `demoSeed.ts` o invocar `seed_demo_store` automáticamente al iniciar sesión. `deduplicateSales` filtra cualquier registro `demo-sale-*` heredado y garantiza unicidad por `id` y `saleNumber`.

---

## 1. Principios de Integridad de Datos

1. **Fuente de Verdad Única:**
   PostgreSQL en Supabase es la fuente de verdad persistente. El estado de React en `InventoryContext` actúa como espejo optimista.
2. **Aislamiento Multi-Tenant:**
   Toda consulta o mutación debe incluir `.eq("store_id", storeId)` y respetar las funciones RLS (`is_store_member`).
3. **Cero Saldo Negativo:**
   Bajo ninguna circunstancia se debe permitir que el stock de un lote o el inventario total descienda de cero.
4. **Snapshotting de Costos:**
   Cada ítem de venta completada debe registrar su costo unitario histórico (`unitCostSnapshot`) y días de garantía para asegurar que los cálculos de utilidad histórica sean inmutables aunque el costo del lote cambie en el futuro.

---

## 2. Algoritmo Determinista de Balanceo de Lotes (`adjustMasterStock`)

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

## 3. Transacción Comercial Atómica (`completeSale`) y CRUD de Ventas (`updateSale` / `deleteSale`)

1. **Candado Sincrónico Anti-Duplicados (`saleInFlightRef`):**
   `completeSale` bloquea ejecuciones paralelas mediante `saleInFlightRef.current` y calcula `nextNumber` usando el máximo `saleNumber` existente (`Math.max`), deduplicando la lista con `deduplicateSales`.
2. **Persistencia Completa en `public.sales`:**
   Al hacer `upsert` en `public.sales`, siempre se deben incluir las columnas `NOT NULL` de PostgreSQL: `store_id`, `id`, `sale_number`, `created_at`, `data` y `updated_at`.
3. **CRUD en Historial (`HistoryView.tsx`):**
   - `updateSale(updatedSale)`: Reconcilia el diferencial de unidades por lote (`oldQty - newQty`) en `products`, actualiza la venta y persiste en Supabase. Requiere confirmación explícita del usuario en el modal.
   - `deleteSale(saleId, restoreStock)`: Restituye opcionalmente las unidades vendidas a sus lotes originales y elimina el registro en Supabase. Requiere Modal de Confirmación obligatorio.

---

## 4. Convenciones de Formateo de Cifras (`src/utils/formatters.ts`)

Utiliza siempre los formateadores centralizados (`formatCOP`, `parseCOPInput`, `formatUnits`, `formatShortDate`, `formatFullDate`) acompañados de la clase `.tabular-nums`.

---

## 5. Verificación de Seguridad y Build

Al finalizar cualquier cambio en la lógica de negocio o tipos de datos:
```bash
npx tsc --noEmit
npm run build
```
Ambos deben concluir con código de salida `0`.
