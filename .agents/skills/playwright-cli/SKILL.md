---
name: playwright-cli
description: >-
  Protocolo y automatización de pruebas End-to-End (E2E) con Playwright CLI para Quiral POS.
  Guía al agente en la ejecución autónoma, filtrado por suites/proyectos (Desktop Chromium y Mobile Safari),
  depuración de fallos visuales y verificación estricta del estándar 100% Exit 0.
---

# Playwright CLI & E2E Testing Automation Skill

Esta Skill establece el protocolo de ejecución, depuración y mantenimiento de la suite de pruebas End-to-End (E2E) de **Quiral POS (`quiral-pwa@1.0.1`)** utilizando Playwright CLI.

---

## 1. Arquitectura de la Suite E2E

La suite de pruebas reside en el directorio `./tests` y está configurada en [`playwright.config.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/playwright.config.ts) con dos proyectos principales:

1. **`Mobile Safari iPhone 14 Standalone`:**
   - Emulación de WebKit / Safari iOS con viewport de iPhone 14 (`390 x 844 px`), soporte táctil (`hasTouch: true`) y entorno PWA standalone.
   - Valida la experiencia móvil: `TopHeader` fijo, `ModalSheet` con gestos y botones en footer, `Navbar` inferior y ausencia de desbordamientos.
2. **`chromium`:**
   - Emulación de navegador de escritorio (`Desktop Chrome`).
   - Valida la estación de trabajo: Platform Split (`useIsDesktop.ts`), tabla matricial Excel (`DesktopInventoryGrid.tsx`), panel de cobro lateral (`DesktopPosTicket.tsx`), tabla de auditoría (`HistoryViewDesktop.tsx`) y vistas administrativas completas.

---

## 2. Comandos Operativos de Playwright CLI

### A. Ejecución Completa (Requisito de Salida Exit 0)

```bash
npx playwright test
```

_Ejecuta los 52 tests en paralelo entre Chromium y Mobile Safari._

### B. Filtrado por Proyecto / Plataforma

```bash
# Ejecutar únicamente pruebas de escritorio
npx playwright test --project="chromium"

# Ejecutar únicamente pruebas de iOS Mobile Safari
npx playwright test --project="Mobile Safari iPhone 14 Standalone"
```

### C. Filtrado por Archivo de Prueba Específico

```bash
# Validar proveedores e historial en escritorio
npx playwright test tests/desktop-suppliers-and-history.spec.ts

# Validar atajos de teclado POS en escritorio
npx playwright test tests/pos-desktop-shortcuts.spec.ts

# Validar flujo móvil y safe-areas
npx playwright test tests/mobile-flow.spec.ts
```

### D. Filtrado por Expresión Regular o Título (`grep`)

```bash
npx playwright test -g "audit table"
npx playwright test -g "keyboard navigation"
```

### E. Depuración y Diagnóstico de Fallos

```bash
# Modo depuración interactiva paso a paso
npx playwright test --debug

# Generar trazas detalladas ante fallos
npx playwright test --trace on

# Abrir el reporte visual HTML del último test run
npx playwright show-report
```

---

## 3. Patrones de Testing Específicos para Quiral POS

### A. Detección de Platform Split en Tests

- **Escritorio (`>= 768px`):** Los tests en `chromium` validan que los elementos móviles (`ModalSheet`, `CheckoutSheet`, `CartSummaryBar`) **NO** existan en el DOM (`await expect(page.locator('[data-testid="modal-sheet"]')).toHaveCount(0)`).
- **Móvil (`< 768px`):** Los tests en `Mobile Safari iPhone 14 Standalone` validan que la barra de navegación inferior (`Navbar`) se oculte cuando hay un modal abierto (`body.modal-open`).

### B. Interacción con Tablas Fijas (`table-fixed`)

En `HistoryViewDesktop.tsx` y `DesktopInventoryGrid.tsx`, las tablas emplean `table-fixed` con anchos de columna estrictos. Para evitar que un texto con `<p class="truncate">` mida 0px y Playwright lo considere no visible:

- Asegurar que la columna del cliente tenga al menos `min-w-[200px]`.
- No comprimir columnas con márgenes negativos o anchos estáticos excesivos en acciones.

### C. Desacoplamiento de Cabecera Fija (`TopHeader`)

Dado que `TopHeader` tiene `position: fixed` y cubre los primeros `4rem` (`var(--quiral-header-offset)`):

- Emplear `scrollIntoViewIfNeeded()` antes de hacer clic en elementos cercanos al tope superior.
- Al verificar elementos del cuerpo principal, asegurar que el contenedor de scroll (`#inventory-scroll`, `#history-scroll`) tenga el scroll compensado.

### D. Simulación de Navegación Matricial por Teclado

Para probar la experiencia Excel en `DesktopInventoryGrid`:

```typescript
// Enfocar la primera celda editable
await page.locator('[data-cell-coord="0-0"]').click();

// Navegar con flechas
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowDown");

// Editar valor
await page.keyboard.press("Enter");
await page.keyboard.type("15000");
await page.keyboard.press("Enter"); // Guarda y baja automáticamente
```

### E. Verificación de Estado Offline e IndexedDB

Para validar el comportamiento Offline-First:

```typescript
// Simular pérdida de conexión
await page.context().setOffline(true);
await expect(
  page.locator('[data-testid="network-status-badge"]')
).toBeVisible();

// Restaurar conexión
await page.context().setOffline(false);
await expect(page.locator('[data-testid="network-status-badge"]')).toHaveCount(
  0
);
```

---

## 4. Runbook de Resolución de Fallos Comunes

| Síntoma en Playwright                               | Causa Raíz Frecuente                                                                      | Solución Determinista                                                                      |
| :-------------------------------------------------- | :---------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `element is not visible` en `<p class="truncate">`  | La celda de la tabla se comprimió a 0px por anchos `w-*` excesivos en columnas adyacentes | Rebalancear anchos de columna en `table-fixed` respetando la guía de `DESKTOP_UI_RULES.md` |
| `click intercepted by <div class="fixed top-0...">` | El elemento está debajo de `TopHeader`                                                    | Usar `scrollIntoViewIfNeeded()` o evaluar el scroll del contenedor local                   |
| `Timed out waiting for locator` en Desktop          | Se está buscando un selector táctil móvil (`CheckoutSheet` o `ModalSheet`) en Chromium    | Validar si la vista es desktop; en PC buscar `DesktopPosTicket` en su lugar                |
| Fallo en Safari Móvil por scrollbar horizontal      | Algún contenedor tiene `w-screen` o márgenes con desborde                                 | Reemplazar `w-screen` por `w-full` y verificar `overflow-x-hidden`                         |

---

## 5. Regla de Oro: Criterio de Aprobación 100% Exit 0

Antes de autorizar cualquier pull request, merge a `develop` o pase a producción:

```bash
npx playwright test
```

Debe finalizar con **52 passed** (o el 100% de los tests creados) y código de retorno `0`.
