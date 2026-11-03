# DESKTOP_UI_RULES.md — Reglas Arquitectónicas y Estándares de Ergonomía Desktop (Platform Split)

Este documento establece las directivas técnicas, patrones arquitectónicos y estándares de diseño ergonómico para la versión de escritorio (`>= 768px`) de **Quiral POS**. Su cumplimiento es obligatorio para cualquier asistente de IA o desarrollador.

---

## 1. Justificación y Fundamento del Patrón "Platform Split"

### El "Infierno de la Hibridación" (Anti-Patrón Descartado)

Intentar que un único archivo JSX maneje simultáneamente la experiencia táctil de celular (`< 768px`) y la estación de trabajo de escritorio (`>= 768px`) mediante clases de visibilidad CSS (`md:hidden`, `hidden md:flex`) produce defectos graves:

1. **Contaminación del DOM:** React sigue montando en memoria los componentes móviles (`ModalSheet`, `CheckoutSheet`, `FloatingCartFAB`, `CartSummaryBar`), consumiendo recursos y generando colisiones de scroll (`overflow: hidden`).
2. **Re-Uso Accidental de Modales Táctiles:** En monitores de 24" o laptops se abrían ventanas angostas con barras de arrastre (_drag handles_) pensadas para el dedo pulgar sobre fondos negros gigantes.
3. **Fragilidad de Pruebas E2E:** Un cambio para ensanchar una tabla en escritorio rompía inadvertidamente los selectores táctiles de iPhone Safari.

### La Solución: Desacoplamiento Físico Real con Semáforos (`useIsDesktop`)

- **Misma URL y Cerebro Compartido:** La PWA mantiene su manifest y rutas únicas (`/`), consumiendo los mismos contextos globales (`useInventory()`, `usePos()`, Supabase).
- **Semáforo en Vista:** El archivo principal actúa exclusivamente como un selector declarativo:
  ```tsx
  export default function PosView(props: PosViewProps) {
    const isDesktop = useIsDesktop();
    return isDesktop ? (
      <PosViewDesktop {...props} />
    ) : (
      <PosViewMobile {...props} />
    );
  }
  ```
- **Montaje Excluyente:** Cuando `isDesktop === true`, el árbol móvil ni siquiera existe en el DOM, garantizando 0ms de interferencia y código 100% puro para PC.

---

## 2. Directiva de Cuarentena Absoluta (Lista Negra en Archivos `*Desktop.tsx`)

En cualquier archivo con sufijo `*Desktop.tsx` o vistas exclusivas de escritorio queda **ESTRICTAMENTE PROHIBIDO**:

- ❌ Importar o renderizar `ModalSheet.tsx` (hojas deslizables de abajo hacia arriba).
- ❌ Importar o renderizar `CheckoutSheet.tsx` (el cobro en PC está permanentemente integrado en el panel lateral `DesktopPosTicket`).
- ❌ Importar o renderizar `FloatingCartFAB.tsx` o `CartSummaryBar.tsx`.
- ❌ Usar barras de arrastre táctiles (_drag handles_), gestos de _swipe_ o listas horizontales ocultas sin desplazamiento por rueda de mouse.

### El Único Puente Compartido:

- **Contextos de Dominio:** `useInventory()`, `usePos()`.
- **Tokens de Color y Tema:** `src/styles/themePalettes.css` (`--accent-primary`, `--accent-hover`, `--accent-subtle`, `.shadow-accent-glow`, `.bg-gradient-accent`).
- **Tipos de Datos:** `src/types/domain.ts`.

---

## 3. Estándares Ergonómicos de Estación de Trabajo Desktop (PC / Mostrador)

### A. Bloqueo de Viewport y "Cero Doble-Scroll"

- En vistas de pantalla completa (`PosViewDesktop.tsx`), el contenedor raíz debe tener `h-[calc(100vh-var(--quiral-header-offset,4rem))] mt-[var(--quiral-header-offset,4rem)] overflow-hidden flex w-full`.
- La ventana del navegador (`window`) jamás debe tener barra de desplazamiento vertical general. Los scrolls son locales e independientes en cada panel (`flex-1 min-h-0 overflow-y-auto`).

### B. Filosofía Keyboard-First (Mouse y Teclado)

- **Atajos de Navegación Global:**
  - <kbd>/</kbd> o <kbd>Ctrl+F</kbd>: Enfocar buscador de catálogo o inventario.
  - <kbd>Ctrl+Enter</kbd>: Completar venta directa desde cualquier punto de la pantalla.
  - <kbd>Esc</kbd>: Cancelar o cerrar diálogos modales de confirmación.
- **Tabla de Inventario Excel (`DesktopInventoryGrid.tsx`):**
  - Navegación matricial por celdas con flechas (`↑`, `↓`, `←`, `→`).
  - <kbd>Enter</kbd> edita y baja automáticamente a la siguiente fila.
  - Fila de inserción rápida en serie (_Quick-Add Row_).

### C. Prohibición de Carruseles Táctiles Cortados

- Los selectores de lotes, filtros o categorías en escritorio deben emplear `flex-wrap` visible o desplegables `<select>` nativos estilizados.
- En el Historial (`HistoryViewDesktop.tsx`), el desglose de productos y garantías debe desplegarse como una **grilla multi-columna visible de un vistazo** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`), eliminando cualquier carrusel horizontal cortado.

### D. Jerarquía Visual y Tipografía de Mostrador

- Cifras monetarias en pesos colombianos (COP) deben usar siempre clase `.tabular-nums` y escala elástica legible a distancia (`text-base` a `text-lg` en totales y clientes).
- Las tablas de auditoría en escritorio (`HistoryViewDesktop.tsx`) utilizan `<table className="w-full text-left border-collapse table-fixed">` con anchos de columna estrictos (`w-20 sm:w-24`, `w-36 sm:w-40`, `min-w-[200px]`, `w-28 sm:w-32`, `w-32 sm:w-36`, `w-48 sm:w-52`) para evitar cualquier colisión entre montos y botones de acción.

### E. Vistas Completas de Escritorio para Flujos Administrativos

- _Perfil de Tienda_ (`DesktopStoreProfileView.tsx`), _Proveedores_ (`DesktopSuppliersView.tsx`) y _Configurar Atributos_ (`DesktopAttributeConfigView.tsx`) se presentan como vistas completas con botón `← Regresar (Esc)` y layouts de alta productividad (`max-w-4xl` o `max-w-5xl mx-auto`), sin modales angostos de teléfono.

---

## 4. Matriz de Componentes por Plataforma

| Componente / Funcionalidad | Móvil (`< 768px`)                      | Escritorio (`>= 768px`)                     | Módulo (`src/modules/`) |
| :------------------------- | :------------------------------------- | :------------------------------------------ | :---------------------- |
| **Punto de Venta (POS)**   | `PosViewMobile.tsx`                    | `PosViewDesktop.tsx`                        | `modules/pos/`          |
| **Cobro de Carrito**       | `CheckoutSheet.tsx` (Bottom Sheet)     | `DesktopPosTicket.tsx` (Panel lateral fijo) | `modules/pos/`          |
| **Inventario**             | `InventoryView.tsx` (Cards verticales) | `DesktopInventoryGrid.tsx` (Tabla Excel)    | `modules/inventory/`    |
| **Historial de Ventas**    | `HistoryViewMobile.tsx` (Cards)        | `HistoryViewDesktop.tsx` (Tabla 1440px)     | `modules/history/`      |
| **Gestión de Proveedores** | `SuppliersModal.tsx` (ModalSheet)      | `DesktopSuppliersView.tsx` (Full View)      | `modules/inventory/`    |
| **Perfil de Tienda**       | `StoreProfileModal.tsx` (ModalSheet)   | `DesktopStoreProfileView.tsx` (Full View)   | `modules/inventory/`    |
| **Configurar Atributos**   | `AttributeConfigModal.tsx`             | `DesktopAttributeConfigView.tsx`            | `modules/inventory/`    |
| **Navegación Global**      | `Navbar.tsx` + `FloatingCartFAB.tsx`   | `DesktopSidebar.tsx`                        | `components/`           |

---

## 5. Arquitectura Modular por Dominios y Capa de Servicios Supabase (Fase 1)

1. **Capa de Servicios y Repositorios (`src/services/`):**
   - `supabaseInventory.ts`: Centraliza consultas, inserciones, eliminaciones en lote y actualización de catálogos y atributos en Supabase.
   - `supabaseSales.ts`: Centraliza la ejecución atómica del RPC `complete_sale`, reconciliación de inventario en modificaciones, eliminación con restitución y cierres de ciclo.
   - `supabaseRealtime.ts`: Aísla las suscripciones por canales de Postgres (`realtime:store:{id}`) fuera de los componentes React.
   - **Regla:** Los contextos de React (`InventoryContext`) jamás consultan directamente las tablas de Supabase; delegan el I/O asíncrono a la capa de servicios y se enfocan en coordinar el estado de React.

2. **Organización por Dominios (`src/modules/`):**
   - `src/modules/pos/`: Contiene `PosViewDesktop`, `PosViewMobile`, `DesktopPosTicket`, `PosProductCard`, `CartSummaryBar`, `CheckoutSheet`, `FloatingCartFAB` y hooks de punto de venta (`usePosShortcuts`).
   - `src/modules/inventory/`: Contiene `DesktopInventoryGrid`, `DesktopProductDrawer`, `DesktopAttributeConfigView`, `DesktopSuppliersView`, `ProductCard`, filtros y modales de inventario.
   - `src/modules/history/`: Contiene `HistoryViewDesktop`, `HistoryViewMobile`, `SalesPerformanceModal`, `CycleClosingModal`.
   - **Enrutadores Semáforo:** Las vistas principales en `src/views/` (`PosView.tsx`, `HistoryView.tsx`, `InventoryView.tsx`) importan de `src/modules/` y aplican `useIsDesktop()` sin duplicación lógica.

---

## 6. Rendimiento y Ergonomía en Escritorio (Fase 2)

1. **Virtualización de DOM con `@tanstack/react-virtual` (`useScrollParentVirtualizer`):**
   - Se implementó el hook de alto rendimiento [`src/hooks/useScrollParentVirtualizer.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/hooks/useScrollParentVirtualizer.ts) para virtualizar tablas grandes tanto en el Inventario (`DesktopInventoryGrid.tsx`) como en el Historial (`HistoryViewDesktop.tsx`).
   - **Cero Doble-Scroll:** La virtualización opera directamente sobre el contenedor de scroll nativo de la estación de trabajo (`#inventory-scroll`, `#history-scroll`), calculando `scrollMargin` dinámicamente y usando espaciadores en el `<tbody>` sin romper la semántica de `<table>`.
   - **Umbral Inteligente (`DESKTOP_VIRTUALIZATION_THRESHOLD = 40`):** Cuando la cantidad de registros es inferior a 40, se renderizan todas las filas sin overhead; al superar el umbral, el navegador únicamente conserva en el DOM las filas visibles en pantalla más un buffer de sobre-escaneo (`overscan: 10-12`).

2. **Optimización Estricta de Renders (`React.memo` + Stable Handlers):**
   - **Componentes Atómicos Memorizados:** `InventoryGridRow`, `EditableGridCell`, `RowActionButtons`, `QuickAddRow` y `HistoryTableRow` están envueltos en `React.memo` con comparadores deterministas de props.
   - **Manejadores Estables de Teclado:** Se utilizó el patrón _Latest-Ref_ con `useMemo<GridHandlers>` para que las funciones de navegación matricial (`↑`, `↓`, `←`, `→`, `Enter`, `Tab`, `Esc`, `Espacio`) y mutación de stock tengan una identidad referencial 100% constante, eliminando re-renders masivos al teclear o editar celdas.
   - **Aislamiento de la Fila Rápida:** `QuickAddRow` mantiene su estado de escritura localmente; escribir en el campo de creación rápida (`Ctrl+N`) no dispara re-renders en las filas existentes de la tabla.

---

## 7. Gobierno de Código, Automatización CI/CD y Testing Riguroso (Fase 3)

1. **Blindaje de Calidad Local (Husky + Lint-staged):**
   - **Gancho `pre-commit` (.husky/pre-commit):**
     1. `npx tsc --noEmit`: Validación estricta de cero errores de tipos TypeScript en todo el proyecto antes de autorizar cualquier commit.
     2. `npx lint-staged`: Formateo y verificación con Prettier exclusivamente sobre los archivos modificados en el área de preparación (_staged_).
   - Si cualquier verificación falla, el commit es bloqueado automáticamente en la terminal con reporte claro del error.

2. **Suite de Pruebas Unitarias de Alta Velocidad (Vitest + JSDOM):**
   - Configurado en `vitest.config.ts` y montado con `@testing-library/jest-dom` en `src/__tests__/setup.ts`.
   - **Cálculos Financieros (`src/__tests__/financialCalculations.test.ts`):** Valida costos promedio ponderados por lote (`avgCost`), redondeo determinista sin centavos residuales en COP, utilidad unitaria, márgenes comerciales porcentuales, subtotales de carrito, descuentos y valorización total del inventario.
   - **Utilidades del Dominio (`src/__tests__/domainFormatters.test.ts`):** Valida `formatCOP()`, `parseCOPInput()`, `formatUnits()`, `formatProductCount()`, formateadores de fechas colombianas (`es-CO`) y el cálculo de estados de garantía (`getWarrantyStatus`).
   - **Navegación Matricial (`src/__tests__/matrixKeyboardNavigation.test.tsx`):** Valida el motor de navegación tipo Excel (`computeNextCell`) con flechas (`↑`, `↓`, `←`, `→`), saltos de fila con `Tab` / `Shift+Tab`, modo conteo rápido, y el ciclo de vida del componente `EditableGridCell` (foco, edición con `Enter`, cancelación con `Esc` y renderizado de badges de stock).

3. **Protocolo de Verificación Obligatoria (100% Exit 0):**
   - `npm run typecheck` (`tsc --noEmit`): 0 errores.
   - `npm run test:unit` (`vitest run`): 100% pruebas unitarias pasando.
   - `npm run build` (`tsc -b && vite build`): Compilación limpia de producción.
   - `npm run test:e2e` (`playwright test`): 52/52 pruebas de integración y regresión visual en verde.

---

## 8. Arquitectura Offline-First, Sincronización en Segundo Plano y Caché (Fase 4)

1. **Almacenamiento Local Persistente con Dexie.js (`src/services/offlineDb.ts`):**
   - Base de datos IndexedDB `QuiralPOS_Offline_DB` estructurada en 3 tablas de alta disponibilidad:
     - `salesQueue`: Cola transaccional FIFO de ventas completadas offline (`queueId`, `id`, `storeId`, `sale`, `lines`, `status`, `attempts`).
     - `cachedProducts`: Instantánea local del catálogo maestro y existencias de lotes para permitir búsquedas y ventas sin conexión.
     - `cachedSuppliers`: Respaldo local de proveedores y canales de abastecimiento.
   - Si la red cae o se inicia la PWA en un mostrador sin internet, el sistema recurre de forma autónoma a la caché local sin interrumpir la operación.

2. **Motor de Sincronización Idempotente en Segundo Plano (`src/services/offlineSyncService.ts`):**
   - Escucha reactivamente los eventos `online` y `offline` del navegador (`window.addEventListener`).
   - Al restablecerse la conectividad, ejecuta `flushSalesQueue()` procesando secuencialmente las ventas acumuladas hacia Supabase mediante el RPC atómico `complete_sale`, previniendo duplicidades y respetando el `store_id` multi-tenant.
   - Hook reactivo `useNetworkSync()` para proveer telemetría de conectividad en tiempo real.

3. **Caché Inteligente con TanStack Query (`src/lib/queryClient.ts`):**
   - Políticas de rendimiento de mostrador: `staleTime: 5 * 60 * 1000` (5 minutos) y `gcTime: 30 * 60 * 1000` (30 minutos).
   - Reintentos condicionados al estado `navigator.onLine` para eliminar peticiones fallidas redundantes en ráfaga.

4. **Componente de Estado de Conectividad (`NetworkStatusBadge.tsx`):**
   - Integrado en `DesktopSidebar.tsx` (escritorio) y en `AppInner` como toast sutil inferior (móvil).
   - Cero ruido visual: permanece oculto si el sistema está en línea con la cola vacía. Se activa automáticamente en color ámbar ante cortes de red o azul pulsante durante la sincronización de ventas acumuladas.
