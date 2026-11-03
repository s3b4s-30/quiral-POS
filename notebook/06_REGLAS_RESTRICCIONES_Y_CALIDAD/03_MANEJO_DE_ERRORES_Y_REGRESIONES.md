# Manual de Resolución de Errores y Regresiones Típicas

> **Ubicación:** `notebook/06_REGLAS_RESTRICCIONES_Y_CALIDAD/03_MANEJO_DE_ERRORES_Y_REGRESIONES.md`  
> **Nivel de Relevancia:** 99% Permanente (Runbook Operativo de Incidencias)  
> **Objetivo:** Documentar los errores históricos más comunes, sus causas técnicas exactas y las soluciones deterministas validadas para evitar reintroducir fallos en Quiral POS.

---

## 1. Incidencia: Límite de Longitud de Línea de Comandos en Windows (`cmd.exe`)

### Síntoma

Al ejecutar `git commit` o `npx lint-staged`, la consola muestra el error:

```text
The command line is too long. / La línea de comandos es demasiado larga.
```

### Causa Raíz

El intérprete de comandos de Windows (`cmd.exe`) impone un límite estricto de **8,191 caracteres** por línea de comando. Si `lint-staged` intenta pasar cientos de rutas de archivos individuales (por ejemplo, al incluir todos los archivos de `.agents/skills/**`) como argumentos a `prettier --write`, el comando desborda este límite y aborta la ejecución.

### Solución Probada y Definitiva

1. **Acotar los patrones en `package.json`:**
   Configurar `lint-staged` para vigilar únicamente el código de la aplicación y las carpetas activas de documentación:
   ```json
   "lint-staged": {
     "{src,tests,docs}/**/*.{ts,tsx,json,css,md}": [
       "prettier --write"
     ],
     "./*.{json,css,md,ts}": [
       "prettier --write"
     ]
   }
   ```
2. **Excluir librerías y artefactos de agentes en `.prettierignore`:**
   Agregar `.agents` y `skills-lock.json` a `.prettierignore` para evitar que Prettier intente procesar miles de archivos externos a la vez.

---

## 2. Incidencia: Espacios en Blanco o Cortes en iOS Safari (Inmunidad UI)

### Síntoma

En iPhone o simulador Safari móvil, aparece una franja blanca debajo del encabezado superior o los últimos productos de la lista quedan tapados detrás de la barra de navegación inferior.

### Causa Raíz

Reintroducción accidental de clases de padding estáticas como `pt-16`, `mt-14`, `pb-32` o `mb-20` dentro de las vistas (`InventoryView`, `PosView`, `HistoryView`).
El contenedor principal `.quiral-scroll-container` en [`src/index.css`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/index.css) **ya gestiona** de forma automática y centralizada los despejes de seguridad:

- Superior: `padding-top: var(--quiral-header-offset)` (`calc(env(safe-area-inset-top, 0px) + 4rem)`).
- Inferior: `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`.

### Solución Probada y Definitiva

1. **Eliminar márgenes intrusos:** Retirar cualquier `pt-16`, `mt-16`, `pb-32` o `mb-20` de los contenedores de las vistas.
2. **Usar exclusivamente el espaciado interior:** Las listas internas deben llevar `pb-6` (o `pb-20 sm:pb-16` en `PosView` únicamente cuando `cartUnits > 0` para despejar el flotante del carrito).
3. **Verificar `index.html`:** Comprobar que `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` y `viewport-fit=cover` permanezcan inalterados.

---

## 3. Incidencia: Doble Scrollbar en Estación de Escritorio (Desktop)

### Síntoma

En pantallas de escritorio ($\ge 768\text{px}$), aparecen dos barras de desplazamiento verticales superpuestas, o el panel derecho (ticket/carrito) se desplaza junto con el catálogo de productos.

### Causa Raíz

Falta de desacoplamiento de scroll entre paneles o uso de modales flotantes móviles en escritorio en lugar de paneles laterales nativos empotrados.

### Solución Probada y Definitiva

1. **Aplicar el patrón de contenedor rígido:**
   El contenedor maestro de escritorio debe tener:
   ```tsx
   <div className="flex h-screen overflow-hidden">
     {/* Panel Izquierdo */}
     <div className="flex-1 overflow-y-auto custom-scrollbar">...</div>
     {/* Panel Derecho Fijo */}
     <div className="w-[420px] flex flex-col h-full overflow-hidden border-l border-zinc-800">
       <div className="flex-1 overflow-y-auto custom-scrollbar">...</div>
       <div className="p-4 border-t border-zinc-800">...</div>
     </div>
   </div>
   ```
2. **Utilizar `custom-scrollbar`:** Garantizar que las barras de scroll sean ultra-delgadas (4px a 6px) y de color zinc tenue, sin bloquear la visibilidad de datos.

---

## 4. Incidencia: Ventas Duplicadas por Latencia o Clic Rápido

### Síntoma

Al pulsar "Cobrar" con conexión lenta, se crean dos ventas consecutivas idénticas en la base de datos o se descuenta el stock dos veces.

### Causa Raíz

Llamadas simultáneas a `completeSale` disparadas antes de que la primera promesa resuelva o la mutación termine.

### Solución Probada y Definitiva

1. **Candado Sincrónico Inmediato (`saleInFlightRef`):**
   No confiar únicamente en el estado de React (`isSubmitting`), ya que es asíncrono. Usar una referencia mutable (`useRef`) para bloquear la ejecución síncrona en el primer frame:
   ```typescript
   if (saleInFlightRef.current) return;
   saleInFlightRef.current = true;
   try {
     await completeSale(saleData);
   } finally {
     saleInFlightRef.current = false;
   }
   ```
2. **Deduplicación por Identificador Único:**
   La función `deduplicateSales` descarta ventas duplicadas que compartan el mismo `id` o `saleNumber`.
3. **RPC Atómico en Supabase:**
   La transacción de venta y descuento de inventario se ejecuta en una sola transacción atómica en PostgreSQL (`complete_sale`), impidiendo estados inconsistentes a nivel de base de datos.

---

## 5. Incidencia: Descuadre de Lotes de Inventario al Editar o Eliminar Ventas

### Síntoma

Al editar o anular una venta en el historial, la cantidad total del producto cambia pero la suma de los lotes individuales no coincide con el total.

### Causa Raíz

Actualización del campo maestro `stock` sin redistribuir ni reconciliar determinísticamente las cantidades entre los lotes asociados en [`src/types/domain.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/types/domain.ts).

### Solución Probada y Definitiva

1. **Regla de Oro Multi-Lote:**
   $$\text{Stock Total} \equiv \sum_{i=1}^{n} \text{Cantidad}(\text{Lote}_i)$$
2. **Reconciliación Determinista en `InventoryContext`:**
   - Al devolver unidades al inventario: añadir al lote con mayor stock o fecha de vencimiento más lejana.
   - Al sustraer unidades del inventario: descontar del lote con mayor stock disponible sin permitir valores negativos.
3. **Exigencia de Confirmación con Credencial de Administrador:**
   Toda edición (`updateSale`) o eliminación (`deleteSale`) en el historial exige obligatoriamente un modal de confirmación y contraseña de administración (`ADMIN_PASSWORD`), previniendo modificaciones no autorizadas en el mostrador.

---

## 6. Incidencia: Parámetro Inválido en Supabase MCP (`project_ref` vs `project_id`)

### Síntoma

Al llamar a herramientas MCP de Supabase como `list_tables` o `execute_sql`, se recibe un error de validación Zod:

```text
ZodError: Unrecognized key: project_ref, Expected: project_id
```

### Causa Raíz

Confusión entre la nomenclatura de la API REST de Supabase (`project_ref` o `ref`) y el esquema tipado del servidor MCP (`project_id`).

### Solución Probada y Definitiva

Siempre utilizar `project_id: "eotycvcvrqkaaozjjfer"` al invocar herramientas del servidor MCP `supabase_mcp`.

---

## 7. Incidencia: Degradación de Empty States (`LottiePlayer`)

### Síntoma

Cuando una lista de productos o historial está vacía, aparece un espacio en blanco o se produce un parpadeo visual porque la animación de Lottie no carga.

### Causa Raíz

Carga asíncrona de archivos JSON externos a través de URLs de red que fallan en entornos sin internet o con restricciones de CSP.

### Solución Probada y Definitiva

1. **Importación Estática Local:**
   Importar la animación directamente desde el paquete de assets locales:
   ```typescript
   import EMPTY_BOX_ANIMATION from "@/assets/empty-box.json";
   ```
2. **Fallback SVG Inmune:**
   Todo componente `LottiePlayer` debe incluir obligatoriamente el componente de respaldo vectorial (`fallback={<DefaultFallbackIcon />}`) para garantizar que nunca se renderice un contenedor vacío.

---

## 8. Incidencia: Desalineación y Ruptura de Precios en Tablas de Mostrador

### Síntoma

Los valores numéricos en las columnas de precios o inventario bailan horizontalmente al cambiar de valor, o muestran símbolos de moneda inconsistentes (`$ 10.000` vs `COP 10,000`).

### Causa Raíz

Concatenación manual de strings (`"$" + price`) y fuentes con números de ancho proporcional (donde el dígito "1" es más estrecho que el "8").

### Solución Probada y Definitiva

1. **Uso Obligatorio de `formatCOP()`:**
   Todos los valores monetarios deben procesarse con [`src/utils/formatters.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/utils/formatters.ts):
   ```typescript
   formatCOP(product.price); // "$ 120.000"
   ```
2. **Aplicar la Clase CSS `.tabular-nums`:**
   Inyectar la clase `.tabular-nums` a todo contenedor o celda numérica para forzar glifos monoespaciados que se alineen perfectamente al borde derecho:
   ```tsx
   <td className="text-right tabular-nums font-mono text-zinc-200">
     {formatCOP(item.total)}
   </td>
   ```
