# 🔄 Flujos Operativos y Ciclos de Vida — Quiral POS

> **Ubicación:** `notebook/02_ARQUITECTURA_Y_SISTEMA/04_FLUJOS_Y_CICLOS_DE_VIDA.md`  
> **Ámbito:** Ciclos de vida comerciales, lógica de negocio y transiciones de estado.

---

## 1. Ciclo de Vida de una Venta (Flujo de Mostrador)

```
[Búsqueda / Atajo / Escaneo]
             │
             ▼
[Adición a Carrito (CartItem)] ──> Asignación automática o manual de Lote (LotStock)
             │
             ▼
[Ajuste de Unidades / Descuentos] ──> Cálculo en tiempo real de subtotales (.tabular-nums)
             │
             ▼
[Confirmación de Cobro]
    ├── Móvil: Abre CheckoutSheet (Bottom Sheet)
    └── PC: Dock permanente en DesktopPosTicket (Ctrl+Enter)
             │
             ▼
[Validación de Conectividad]
    ├── Con Red: RPC complete_sale en Supabase (Transacción atómica)
    └── Sin Red: Inserta en salesQueue (Dexie.js) + descuenta stock en memoria
             │
             ▼
[Actualización del Estado Local] ──> Limpia carrito + emite ticket de comprobante
```

---

## 2. Ciclo de Reabastecimiento e Inventario Multi-Lote

En Quiral POS, un producto no tiene un costo único global estático; el costo real se determina por la suma de sus lotes individuales:

1. **Recepción de Mercancía (`addLot`):**
   - Se crea un nuevo registro de lote con: `lotId`, `quantity`, `costPriceCOP`, `supplierId`, `purchaseDate`, `warrantyDays`.
   - El costo promedio ponderado (`avgCost`) se recalcula automáticamente:
     $$\text{Costo Ponderado} = \frac{\sum (\text{Cantidad}_i \times \text{Costo}_i)}{\sum \text{Cantidad}_i}$$
2. **Ajuste de Stock Manual (`updateStock`):**
   - **Si se añade stock:** Se incrementa prioritariamente el lote que tenga mayor inventario existente para mantener la consistencia.
   - **Si se sustrae stock:** Se descuenta del lote con mayor cantidad disponible. Jamás se permite que las existencias caigan por debajo de 0.

---

## 3. Ciclo de Modificación y Eliminación de Ventas (`HistoryView`)

> [!CAUTION]
> **REGLA DETERMINISTA:**
> Eliminar o editar una venta pasada en `HistoryView.tsx` altera la contabilidad y el stock físico de la tienda. Por ello, está sujeto a un protocolo de seguridad estricto:

1. **Modal de Confirmación Obligatorio:** Jamás se ejecuta una mutación destructiva en un solo clic; siempre se exige confirmación explícita mediante un diálogo modal centrado con resumen de la venta a afectar.
2. **Reconciliación Determinista de Lotes (`reconcileStockOnSaleMutation`):**
   - **Al eliminar una venta (`deleteSale`):** Las unidades que salieron de cada lote específico son restituidas con exactitud a su lote de origen en `products`.
   - **Al modificar una venta (`updateSale`):** Se calcula el delta neto de unidades: si se reducen productos se devuelve stock; si se aumentan productos se descuenta stock previa validación de saldo disponible.
3. **Persistencia Remota:** La operación se confirma en Supabase actualizando la cabecera en `sales` y el inventario en `products`.

---

## 4. Ciclo de Cierre de Caja (`CycleClosingModal`)

1. **Apertura de Turno:** Al iniciar operaciones comerciales, se registra el fondo de caja inicial.
2. **Operación Continua:** Cada venta acumula métricas clasificadas por método de pago:
   - Efectivo (_Cash_)
   - Transferencia electrónica (_Bancolombia, Nequi, Daviplata_)
   - Datáfono / Tarjeta
3. **Arqueo y Cierre:**
   - El cajero o administrador ingresa el monto físico contado en caja.
   - El sistema calcula automáticamente la diferencia o descuadre:
     $$\text{Diferencia} = \text{Monto Físico Contado} - (\text{Fondo Inicial} + \text{Ventas en Efectivo})$$
   - Se registra el cierre en `cycle_closings` con marca de tiempo, usuario y totales para auditoría contable.
