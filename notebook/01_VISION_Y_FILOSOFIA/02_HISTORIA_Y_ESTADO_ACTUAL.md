# 📜 Historia y Estado Actual del Proyecto — Quiral POS

> **Ubicación:** `notebook/01_VISION_Y_FILOSOFIA/02_HISTORIA_Y_ESTADO_ACTUAL.md`  
> **Ámbito:** Evolución cronológica, fases consolidadas y estado actual del código (v1.0.1).

---

## 1. Evolución Histórica del Proyecto

Quiral POS inició como un prototipo monolítico enfocado en la experiencia táctil móvil de mostrador. Sin embargo, a medida que la tienda requirió soporte para computadores de escritorio, grandes volúmenes de inventario y tolerancia a fallos de red, el proyecto evolucionó a través de 4 fases arquitectónicas rigurosas:

### 🔹 Fase 0: Nacimiento y Prototipo Táctil Inicial

- Creación de la PWA base con Vite, React y Tailwind CSS.
- Adopción de los estándares Apple Human Interface Guidelines (HIG) para iOS Safari en modo PWA Standalone.
- Configuración inicial de Supabase para almacenar catálogo y ventas.
- _Problema detectado:_ La interfaz de escritorio reutilizaba componentes móviles (modales angostos y carruseles táctiles), generando una experiencia deficiente en monitores de PC.

### 🔹 Fase 1: Reestructuración Modular por Dominios y Capa de Servicios

- **Fecha de consolidación:** Octubre 2026.
- **Qué cambió:** Fin del código espagueti. Creación de `src/modules/` dividida en tres dominios clave:
  - `src/modules/pos/`: Punto de venta móvil y de escritorio, ticket lateral y carrito.
  - `src/modules/inventory/`: Grilla de inventario, cajón de inspección y filtros.
  - `src/modules/history/`: Tabla de auditoría, cierres de ciclo y métricas comerciales.
- **Capa de Servicios (`src/services/`):** Desacoplamiento de Supabase de los componentes de React. `supabaseInventory.ts`, `supabaseSales.ts` y `supabaseRealtime.ts` asumen todo el I/O asíncrono.

### 🔹 Fase 2: Rendimiento y Ergonomía Desktop (Platform Split Real)

- **Qué cambió:** Separación física de vistas mediante el hook `useIsDesktop.ts`.
- **Virtualización de DOM:** Implementación de `@tanstack/react-virtual` con el hook [`useScrollParentVirtualizer.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/hooks/useScrollParentVirtualizer.ts) en `DesktopInventoryGrid` y `HistoryViewDesktop`, soportando miles de registros con cero doble scroll.
- **Navegación Matricial tipo Excel:** Manejo de teclado con flechas (`↑`, `↓`, `←`, `→`), edición directa con <kbd>Enter</kbd> y fila de creación rápida en serie (`QuickAddRow`).
- **Memorización Determinista:** Wrapping de filas y celdas con `React.memo` y manejadores referenciales estables con el patrón _Latest-Ref_.

### 🔹 Fase 3: Gobierno de Calidad, CI/CD y Pruebas Unitarias

- **Qué cambió:** Blindaje local con ganchos de Git (Husky + `lint-staged`) ejecutando validación de tipos TypeScript y formateo Prettier antes de cada commit.
- **Suite Unitaria (Vitest + JSDOM):** 53 pruebas automatizadas de alta velocidad cubriendo cálculos financieros de costos ponderados (`avgCost`), formateo de moneda colombiana (`formatCOP`), navegación matricial y estados de sincronización.

### 🔹 Fase 4: Arquitectura Offline-First y Sincronización en Segundo Plano

- **Qué cambió:** Integración de Dexie.js (IndexedDB) para persistir localmente la cola de ventas (`salesQueue`), catálogo de productos (`cachedProducts`) y proveedores (`cachedSuppliers`).
- **Motor de Sincronización Idempotente (`offlineSyncService.ts`):** Escucha eventos `online`/`offline` y vacía la cola acumulada hacia Supabase sin duplicar ventas.
- **Caché Inteligente con TanStack Query (`queryClient.ts`):** Caché de 5 minutos con recolección de basura a 30 minutos.
- **Indicador `NetworkStatusBadge`:** Badge visual sutil que informa el estado de conexión sin estorbar en el mostrador.

### 🔹 Fase de Consolidación: Habilidades Maestras y Manifiesto de Gobierno

- Integración de las 3 Habilidades Maestras (`ui-ux-modern-taste`, `image-to-code`, `playwright-cli`).
- Integración de los frameworks upstream oficiales: Taste Skill v2 (`design-taste-frontend`), Web Design Guidelines (`web-design-guidelines`), Awesome Design Skills (`awesome-design-skills`) y `@playwright/mcp`.
- Creación de [`docs/AGENTS_AND_SKILLS_MANIFESTO.md`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/docs/AGENTS_AND_SKILLS_MANIFESTO.md).

### 🔹 Hito: Ergonomía Desktop, Nitidez HD y Supresión de Aberración Cromática

- **Qué cambió:** Erradicación de halos cromáticos y aberración subpixel en pantallas OLED mediante `-webkit-font-smoothing: antialiased;` y clase utilitaria `.antialiased-hd`.
- **Iconografía Profesional:** Sustitución definitiva de emojis y estrellas (✨ / `Sparkles`) por `<Zap />` vectorial en barras y tablas operativas.
- **Ergonomía de Selección en Fila:** Clic en fila selecciona; apertura de inspección y enlaces con `e.stopPropagation()`.
- **Formateo Financiero Estricto:** Alineación vertical con `formatCOP()` y `.tabular-nums` en todo el Historial Desktop.

### 🔹 Hito: Gobernanza de Presupuesto de Tokens y Consolidación de Skills

- **Qué cambió:** Diagnóstico de saturación en Antigravity (`25.335 / 20.000 tokens`). Poda de 78 carpetas redundantes y unificación de 67 estilos bajo el enrutador maestro `awesome-design-skills`.
- **Tokens Liberados:** >15.000 tokens liberados, reduciendo el consumo al 40-45% y reactivando herramientas críticas (`supabase`, `supabase-postgres-best-practices`, `impeccable`, `design-taste-frontend`).
- **Enriquecimiento del Motor POS y UI:** Integración de PostgreSQL RLS Best Practices, bloqueo pesimista `FOR UPDATE`, directivas Anti-Slop y microinteracciones físicas.

---

## 2. Estado Actual del Sistema (v1.0.1)

Actualmente, el repositorio reside en la rama `develop` con un estándar innegociable de **100% Exit 0**:

| Criterio de Verificación      | Herramienta                  | Resultado Actual                                           |
| :---------------------------- | :--------------------------- | :--------------------------------------------------------- |
| **Tipado TypeScript**         | `npx tsc --noEmit`           | **0 errores** en todo el proyecto                          |
| **Pruebas Unitarias**         | `npm run test:unit` (Vitest) | **53/53 passed** (100% verde)                              |
| **Compilación Producción**    | `npm run build` (Vite 6)     | **0 advertencias, 0 errores** (build en < 4s)              |
| **Pruebas End-to-End**        | `npx playwright test`        | **52/52 passed** (Chromium + Mobile Safari)                |
| **Integridad de Git**         | `git status`                 | Árbol limpio, secretos protegidos, cero `.pyc` o logs      |
| **Conexión de Base de Datos** | Supabase MCP                 | 9 tablas con RLS activo en proyecto `eotycvcvrqkaaozjjfer` |
| **Monitoreo de Excepciones**  | Sentry MCP                   | Conectado y operativo en organización `s3b4s`              |
