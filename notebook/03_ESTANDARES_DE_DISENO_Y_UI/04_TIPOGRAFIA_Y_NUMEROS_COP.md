# 🔢 Tipografía, Números Tabulares y Formateo COP — Quiral POS

> **Ubicación:** `notebook/03_ESTANDARES_DE_DISENO_Y_UI/04_TIPOGRAFIA_Y_NUMEROS_COP.md`  
> **Ámbito:** Reglas tipográficas, prevención de jitter numérico, formateo en pesos colombianos (COP).

---

## 1. La Regla de Oro Numérica: `.tabular-nums`

En un punto de venta, los números cambian constantemente (cantidades de carrito, totales calculados, existencias de inventario). Si se utilizan fuentes proporcionales estándar, cada dígito tiene un ancho diferente (el número `1` es mucho más estrecho que el `8`), causando que los totales oscilen o tiemblen horizontalmente (_jitter tipográfico_).

### Solución Determinista Universal:

Todas las cifras monetarias, cantidades, códigos de barras, SKUs y porcentajes deben llevar la clase CSS `.tabular-nums`:

```css
/* Definición en src/index.css */
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

Esto fuerza a que todos los números tengan exactamente el mismo ancho de columna, alineándose verticalmente con perfección contable.

---

## 2. Formateadores Universales del Dominio (`src/utils/formatters.ts`)

Queda terminantemente prohibido formatear precios o fechas mediante funciones ad-hoc (`$${monto.toLocaleString()}`) dentro de componentes React. Debe importarse siempre la función universal correspondiente:

### A. Precios en Pesos Colombianos: `formatCOP(value)`

```typescript
import { formatCOP } from '../../utils/formatters';

// Ejemplo: formatCOP(150000) -> "$ 150.000 COP"
<span className="text-base font-bold tabular-nums text-white">
  {formatCOP(cartTotal)}
</span>
```

- Redondea deterministamente a enteros en COP (evita centavos residuales irrelevantes en Colombia).
- Aplica formato `es-CO` con puntos como separadores de miles y espacio antes de `COP`.

### B. Unidades y Conteo: `formatUnits(units)` y `formatProductCount(count)`

- Presenta las existencias físicas con claridad (ej. `12 uds`, `1 ud`).

### C. Fechas y Garantías: `formatShortDate(date)` y `getWarrantyStatus(date, days)`

- Formatea fechas colombianas legibles (`dd/MM/yyyy HH:mm`).
- Calcula si la garantía de un lote está _Vigente_, _Próxima a vencer_ o _Vencida_.

---

## 3. Nitidez Tipográfica en Pantallas Grandes

En monitores de escritorio (>= 768px), las fuentes pueden verse delgadas o poco nítidas si no se aplican los filtros correctos del motor de renderizado:

1. **Suavizado de Fuentes Activo y Clase `.antialiased-hd`:**
   ```css
   /* Aplicado globalmente y en grillas de datos */
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   text-rendering: optimizeLegibility;
   ```
2. **Supresión Estricta de Aberración Cromática (Anti-Halos):**
   En monitores OLED y fondos oscuros (`#000000`), el renderizado de subpíxeles provoca franjas cromáticas (halos de color) cuando se superpone texto coloreado translúcido (`text-accent`) sobre fondos sutiles del mismo tono (`bg-accent-subtle`).
   - **Regla inquebrantable:** Usar texto blanco o primario de alto contraste sobre tarjetas sólidas (`bg-[var(--bg-elevated)] dark:bg-black/95`) y badges sólidos (`bg-accent text-white`).
3. **Erradicación de Estrellas y Emojis (✨ / `Sparkles`):**
   Sustituidos de forma unificada por el icono vectorial profesional `<Zap className="h-4 w-4 shrink-0" />` de `lucide-react`.
4. **Pesos Robustos de Mostrador:** Evitar pesos ultradelgados (`font-light`, `font-thin`). Los textos de producto, ticket y auditoría deben usar `font-medium`, `font-semibold` o `font-bold` con colores de alto contraste (`text-white` para títulos, `text-neutral-400` para metadatos).
5. **Calibración de Columnas en Tablas (`table-fixed`):**
   Para evitar que columnas numéricas se colapsen o trunquen montos grandes en el Historial (`HistoryViewDesktop.tsx`):
   - Ticket / ID: `w-20 sm:w-24`
   - Fecha / Hora: `w-36 sm:w-40`
   - Cliente / Detalle: `min-w-[200px]` con `truncate` seguro
   - Método / Estado: `w-28 sm:w-32`
   - Total COP: `w-32 sm:w-36 text-right pr-4 tabular-nums font-semibold`
   - Acciones: `w-48 sm:w-52 text-right pr-3`
