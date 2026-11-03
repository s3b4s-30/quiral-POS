# 💾 Modelado de Datos, Supabase y Arquitectura Offline-First

> **Ubicación:** `notebook/02_ARQUITECTURA_Y_SISTEMA/03_DATOS_SUPABASE_Y_OFFLINE.md`  
> **Ámbito:** Esquema de base de datos PostgreSQL, políticas RLS, RPC `complete_sale`, IndexedDB y sincronización.

---

## 1. El Esquema de Base de Datos en Supabase (PostgreSQL)

La persistencia en la nube reside en Supabase bajo el proyecto multi-tenant `quiral-POS` (`eotycvcvrqkaaozjjfer`). Cada consulta y mutación está estrictamente aislada por el identificador de tienda (`store_id`):

| Tabla                        | Propósito y Columnas Principales                                                                                                    | Políticas RLS Activas                                          |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **`public.stores`**          | Registro de tiendas físicas, nombre comercial, configuración y tema activo.                                                         | Solo miembros autorizados de la tienda pueden leer/actualizar. |
| **`public.store_members`**   | Vinculación entre usuarios de Supabase Auth (`user_id`) y tiendas (`store_id`, `role: owner / admin / cashier`).                    | Define la pertenencia mediante función `is_store_member()`.    |
| **`public.suppliers`**       | Directorio de proveedores de mercancía (`id`, `store_id`, `name`, `contact`, `phone`).                                              | Aislado por `store_id`.                                        |
| **`public.products`**        | Catálogo maestro de artículos, código de barras, categoría, precio de venta y arreglo JSONB de lotes (`lots: LotStock[]`).          | Aislado por `store_id`.                                        |
| **`public.sales`**           | Registro histórico de ventas completadas, número de ticket (`sale_number`), cliente, método de pago, total COP y líneas de detalle. | Aislado por `store_id`.                                        |
| **`public.cycle_closings`**  | Arqueos y cierres de turno de caja registradora, fecha inicio/fin, ventas totales e ingresos por método.                            | Aislado por `store_id`.                                        |
| **`public.categories`**      | Categorías personalizadas del catálogo de la tienda.                                                                                | Aislado por `store_id`.                                        |
| **`public.attribute_bank`**  | Banco de atributos dinámicos (colores, capacidades, voltajes, tipos de conector).                                                   | Aislado por `store_id`.                                        |
| **`public.catalog_configs`** | Configuración avanzada del orden visual del catálogo y reglas de filtrado.                                                          | Aislado por `store_id`.                                        |

---

## 2. La Transacción Atómica de Venta: RPC `complete_sale`

Para evitar estados inconsistentes (por ejemplo, que se cree la venta pero falle el descuento de stock), Quiral POS ejecuta las ventas a través de una función almacenada en PostgreSQL:

```sql
-- Firma del procedimiento en PostgreSQL
complete_sale(
  p_store_id uuid,
  p_sale_data jsonb,
  p_lines jsonb
) RETURNS jsonb
```

### Operaciones Ejecutadas en una Única Transacción:

1. **Verificación de Existencias:** Comprueba que cada producto y lote tenga stock suficiente (`current_stock >= requested_units`).
2. **Descuento Determinista por Lote:** Sustrae las unidades vendidas directamente del lote seleccionado en el arreglo JSONB de la tabla `products`.
3. **Inserción de Venta:** Inserta el registro en `sales` generando un `sale_number` incremental protegido contra condiciones de carrera.
4. **Candado en Vuelo del Cliente (`saleInFlightRef`):** El frontend previene dobles clics accidentales bloqueando el botón de venta mediante una referencia mutable sincrónica hasta que el servidor responde.

---

## 3. Arquitectura Offline-First con Dexie.js (IndexedDB)

La base de datos local `QuiralPOS_Offline_DB` reside en el almacenamiento del navegador y se compone de 3 tablas de alta velocidad:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DEXIE.JS (QuiralPOS_Offline_DB)                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. salesQueue: Cola FIFO de ventas completadas sin internet            │
│    • queueId (auto-incremental)                                        │
│    • id / saleNumber / storeId / status ('pending'|'syncing'|'failed') │
│    • lines / saleData / attempts                                       │
│                                                                        │
│ 2. cachedProducts: Respaldo local del catálogo para venta sin conexión │
│    • id / store_id / name / price / lots / total_stock                 │
│                                                                        │
│ 3. cachedSuppliers: Directorio local de proveedores para compras       │
└────────────────────────────────────────────────────────────────────────┘
```

### Ciclo de Sincronización Automática (`offlineSyncService.ts`):

1. **Detección de Caída de Red:** Si `navigator.onLine === false` o la petición a Supabase arroja un error de red, la venta se almacena de inmediato en `salesQueue` con estado `'pending'` y se descuenta el stock localmente en memoria.
2. **Restablecimiento de Conexión:** El servicio escucha el evento `window.addEventListener('online', ...)` y dispara `flushSalesQueue()`.
3. **Vaciado Idempotente:** Procesa una a una las ventas en cola enviándolas al RPC `complete_sale` de Supabase. Al recibir confirmación, elimina el registro de la cola y actualiza el catálogo remoto.
4. **Feedback Visual:** El badge [`NetworkStatusBadge.tsx`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/components/NetworkStatusBadge.tsx) cambia reactivamente entre:
   - _Oculto:_ Conexión óptima y cola vacía.
   - _Ámbar:_ Sistema trabajando en modo offline con ventas pendientes.
   - _Azul pulsante:_ Sincronizando ventas acumuladas con la nube.

---

## 4. Caché Inteligente con TanStack Query (`queryClient.ts`)

- **Tiempo de Validez (`staleTime`):** 5 minutos (`5 * 60 * 1000`). Durante este tiempo, los componentes reutilizan los datos en memoria sin disparar llamadas a Supabase.
- **Recolección de Basura (`gcTime`):** 30 minutos.
- **Detección de Red:** Las consultas condicionan sus reintentos automáticos a que el dispositivo esté efectivamente conectado (`navigator.onLine`), eliminando errores innecesarios en la consola.
