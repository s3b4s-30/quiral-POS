# Estándar 100% Exit 0 — Quiral POS

> **Ubicación:** `notebook/06_REGLAS_RESTRICCIONES_Y_CALIDAD/02_ESTANDAR_100_EXIT_0.md`  
> **Nivel de Relevancia:** 99% Permanente (Protocolo Operativo de QA)  
> **Objetivo:** Definir el estándar de calidad determinista, los 4 pilares de validación obligatoria y los controles de integración continua para Quiral POS (`quiral-pwa@1.0.1`).

---

## 1. Filosofía del "100% Exit 0"

En el desarrollo de **Quiral POS**, no existen los "errores menores", las advertencias ignoradas ni las pruebas aceptadas "a medias". Cada cambio introducido en la base de código debe satisfacer una regla absoluta:

$$\text{Validación} = (\text{TypeScript} == 0) \land (\text{Vitest} == 0) \land (\text{Vite Build} == 0) \land (\text{Playwright} == 0)$$

Si cualquiera de estos 4 comandos finaliza con un código de salida diferente de `0`, el cambio es **automáticamente rechazado**, no puede ser commiteado ni desplegado, y debe ser subsanado de inmediato.

---

## 2. Los 4 Pilares de Validación

### Pilar 1: Verificación Estricta de Tipos (TypeScript)

```bash
npx tsc --noEmit
```

- **Propósito:** Garantizar que todo el sistema respete los contratos de tipos definidos en [`src/types/domain.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/types/domain.ts) y los tipos de Supabase/Dexie.
- **Reglas Infranqueables:**
  - Cero errores tipográficos en cualquier archivo `.ts` o `.tsx`.
  - Prohibido terminantemente el uso de `@ts-ignore` o `@ts-nocheck`.
  - Prohibido el escape tipográfico con `any` deliberado (usar `unknown` con type guards si la fuente es incierta).
  - Todos los hooks, servicios, mutaciones y componentes deben declarar tipos explícitos para props y retornos.

---

### Pilar 2: Pruebas Unitarias Deterministas (Vitest)

```bash
npm run test:unit
```

- **Propósito:** Ejecutar en milisegundos las suites de pruebas unitarias que validan la lógica comercial más crítica y sensible del sistema:
  - [`tests/unit/financialCalculations.test.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/tests/unit/financialCalculations.test.ts): Cálculos de totales, subtotales, márgenes de ganancia, balance de inventario y reconciliación de devoluciones.
  - [`tests/unit/domainFormatters.test.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/tests/unit/domainFormatters.test.ts): Formateo de pesos colombianos (`formatCOP`), números de factura, fechas (`formatShortDate`) y unidades.
  - [`tests/unit/matrixKeyboardNavigation.test.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/tests/unit/matrixKeyboardNavigation.test.ts): Navegación por matriz de cuadrícula de productos en escritorio mediante teclado (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`).
- **Métrica de Aprobación:** 100% de las pruebas pasando en verde (actualmente 53/53 pruebas sin fallos).

---

### Pilar 3: Compilación de Producción Limpia (Vite)

```bash
npm run build
```

- **Propósito:** Validar que el empaquetado de producción (`dist/`) se genere sin errores de importación, sin dependencias faltantes y sin sintaxis incompatible con los navegadores modernos.
- **Validaciones:**
  - Minificación correcta de JavaScript y CSS.
  - Generación de Service Worker de la PWA.
  - Control de pesos de bundle (alertar si chunks individuales superan los límites recomendados de carga inicial).

---

### Pilar 4: Pruebas End-to-End en Navegadores Reales (Playwright)

```bash
npx playwright test
```

- **Propósito:** Simular el comportamiento del usuario final en múltiples navegadores y resoluciones para detectar regresiones visuales o de interacción:
  - **Desktop Chromium (1280x800):** Estación de mostrador, navegación por teclado, paneles divididos, visualización de tickets.
  - **Mobile Safari (iPhone 13 / WebKit 390x844):** PWA móvil, Bottom Sheets, anclaje superior de cabecera, cálculo de safe-areas táctiles.
- **Flujos Críticos Evaluados:**
  - Creación de producto con múltiples lotes.
  - Venta atómica en carrito y descuento de inventario.
  - Edición de venta en historial y reconciliación de stock.
  - Búsqueda en tiempo real y filtrado de catálogo.
- **Métrica de Aprobación:** 100% de las pruebas pasando en verde (actualmente 52/52 pruebas sin fallos).

---

## 3. Automatización de Ganchos de Git (Husky & Lint-staged)

Para evitar que código defectuoso alcance el historial de Git, Quiral POS utiliza un gancho de `pre-commit` configurado con **Husky** y **lint-staged**:

### Configuración del Gancho (`.husky/pre-commit`)

```bash
npx tsc --noEmit
npx lint-staged
```

### Configuración de Scopes en `package.json`

Para evitar el límite de longitud de línea de comandos en sistemas Windows (`cmd.exe` máximo 8,191 caracteres), los scopes de `lint-staged` están optimizados:

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

> [!NOTE]
> La carpeta `.agents/` y archivos autogenerados como `skills-lock.json` están excluidos del formateo de `lint-staged` mediante `.prettierignore` para preservar su estructura exacta y proteger el rendimiento en Windows.

---

## 4. Checklist de Cierre de Tarea para Agentes de IA

Todo agente o asistente que realice cambios en el código de Quiral POS debe ejecutar y certificar la siguiente secuencia antes de dar su tarea por completada:

```text
[ ] 1. npx tsc --noEmit         -> Exit Code 0 (0 errores tipográficos)
[ ] 2. npm run test:unit        -> Exit Code 0 (53 pruebas unitarias pasando)
[ ] 3. npm run build            -> Exit Code 0 (Compilación limpia en dist/)
[ ] 4. npx playwright test      -> Exit Code 0 (52 pruebas E2E pasando)
```

Si algún paso falla, el agente **no puede** justificar el fallo ni ignorarlo: debe diagnosticar la causa raíz, aplicar la corrección y re-ejecutar la suite completa hasta obtener **100% Exit 0**.
