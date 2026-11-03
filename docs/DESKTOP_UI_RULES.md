# DESKTOP_UI_RULES.md — Reglas Arquitectónicas y Estándares de Ergonomía Desktop (Platform Split)

Este documento establece las directivas técnicas, patrones arquitectónicos y estándares de diseño ergonómico para la versión de escritorio (`>= 768px`) de **Quiral POS**. Su cumplimiento es obligatorio para cualquier asistente de IA o desarrollador.

---

## 1. Justificación y Fundamento del Patrón "Platform Split"

### El "Infierno de la Hibridación" (Anti-Patrón Descartado)
Intentar que un único archivo JSX maneje simultáneamente la experiencia táctil de celular (`< 768px`) y la estación de trabajo de escritorio (`>= 768px`) mediante clases de visibilidad CSS (`md:hidden`, `hidden md:flex`) produce defectos graves:
1. **Contaminación del DOM:** React sigue montando en memoria los componentes móviles (`ModalSheet`, `CheckoutSheet`, `FloatingCartFAB`, `CartSummaryBar`), consumiendo recursos y generando colisiones de scroll (`overflow: hidden`).
2. **Re-Uso Accidental de Modales Táctiles:** En monitores de 24" o laptops se abrían ventanas angostas con barras de arrastre (*drag handles*) pensadas para el dedo pulgar sobre fondos negros gigantes.
3. **Fragilidad de Pruebas E2E:** Un cambio para ensanchar una tabla en escritorio rompía inadvertidamente los selectores táctiles de iPhone Safari.

### La Solución: Desacoplamiento Físico Real con Semáforos (`useIsDesktop`)
- **Misma URL y Cerebro Compartido:** La PWA mantiene su manifest y rutas únicas (`/`), consumiendo los mismos contextos globales (`useInventory()`, `usePos()`, Supabase).
- **Semáforo en Vista:** El archivo principal actúa exclusivamente como un selector declarativo:
  ```tsx
  export default function PosView(props: PosViewProps) {
    const isDesktop = useIsDesktop();
    return isDesktop ? <PosViewDesktop {...props} /> : <PosViewMobile {...props} />;
  }
  ```
- **Montaje Excluyente:** Cuando `isDesktop === true`, el árbol móvil ni siquiera existe en el DOM, garantizando 0ms de interferencia y código 100% puro para PC.

---

## 2. Directiva de Cuarentena Absoluta (Lista Negra en Archivos `*Desktop.tsx`)

En cualquier archivo con sufijo `*Desktop.tsx` o vistas exclusivas de escritorio queda **ESTRICTAMENTE PROHIBIDO**:
* ❌ Importar o renderizar `ModalSheet.tsx` (hojas deslizables de abajo hacia arriba).
* ❌ Importar o renderizar `CheckoutSheet.tsx` (el cobro en PC está permanentemente integrado en el panel lateral `DesktopPosTicket`).
* ❌ Importar o renderizar `FloatingCartFAB.tsx` o `CartSummaryBar.tsx`.
* ❌ Usar barras de arrastre táctiles (*drag handles*), gestos de *swipe* o listas horizontales ocultas sin desplazamiento por rueda de mouse.

### El Único Puente Compartido:
* **Contextos de Dominio:** `useInventory()`, `usePos()`.
* **Tokens de Color y Tema:** `src/styles/themePalettes.css` (`--accent-primary`, `--accent-hover`, `--accent-subtle`, `.shadow-accent-glow`, `.bg-gradient-accent`).
* **Tipos de Datos:** `src/types/domain.ts`.

---

## 3. Estándares Ergonómicos de Estación de Trabajo Desktop (PC / Mostrador)

### A. Bloqueo de Viewport y "Cero Doble-Scroll"
* En vistas de pantalla completa (`PosViewDesktop.tsx`), el contenedor raíz debe tener `h-[calc(100vh-var(--quiral-header-offset,4rem))] mt-[var(--quiral-header-offset,4rem)] overflow-hidden flex w-full`.
* La ventana del navegador (`window`) jamás debe tener barra de desplazamiento vertical general. Los scrolls son locales e independientes en cada panel (`flex-1 min-h-0 overflow-y-auto`).

### B. Filosofía Keyboard-First (Mouse y Teclado)
* **Atajos de Navegación Global:**
  * <kbd>/</kbd> o <kbd>Ctrl+F</kbd>: Enfocar buscador de catálogo o inventario.
  * <kbd>Ctrl+Enter</kbd>: Completar venta directa desde cualquier punto de la pantalla.
  * <kbd>Esc</kbd>: Cancelar o cerrar diálogos modales de confirmación.
* **Tabla de Inventario Excel (`DesktopInventoryGrid.tsx`):**
  * Navegación matricial por celdas con flechas (`↑`, `↓`, `←`, `→`).
  * <kbd>Enter</kbd> edita y baja automáticamente a la siguiente fila.
  * Fila de inserción rápida en serie (*Quick-Add Row*).

### C. Prohibición de Carruseles Táctiles Cortados
* Los selectores de lotes, filtros o categorías en escritorio deben emplear `flex-wrap` visible o desplegables `<select>` nativos estilizados.
* En el Historial (`HistoryViewDesktop.tsx`), el desglose de productos y garantías debe desplegarse como una **grilla multi-columna visible de un vistazo** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`), eliminando cualquier carrusel horizontal cortado.

### D. Jerarquía Visual y Tipografía de Mostrador
* Cifras monetarias en pesos colombianos (COP) deben usar siempre clase `.tabular-nums` y escala elástica legible a distancia (`text-base` a `text-lg` en totales y clientes).
* Las tablas de auditoría en escritorio (`HistoryViewDesktop.tsx`) utilizan `<table className="w-full text-left border-collapse table-fixed">` con anchos de columna estrictos (`w-24`, `w-44`, `min-w-[300px]`, `w-36`, `w-44`).

### E. Vistas Completas de Escritorio para Flujos Administrativos
* *Perfil de Tienda* (`DesktopStoreProfileView.tsx`), *Proveedores* (`DesktopSuppliersView.tsx`) y *Configurar Atributos* (`DesktopAttributeConfigView.tsx`) se presentan como vistas completas con botón `← Regresar (Esc)` y layouts de alta productividad (`max-w-4xl` o `max-w-5xl mx-auto`), sin modales angostos de teléfono.

---

## 4. Matriz de Componentes por Plataforma

| Componente / Funcionalidad | Móvil (`< 768px`) | Escritorio (`>= 768px`) | Módulo (`src/modules/`) |
| :--- | :--- | :--- | :--- |
| **Punto de Venta (POS)** | `PosViewMobile.tsx` | `PosViewDesktop.tsx` | `modules/pos/` |
| **Cobro de Carrito** | `CheckoutSheet.tsx` (Bottom Sheet) | `DesktopPosTicket.tsx` (Panel lateral fijo) | `modules/pos/` |
| **Inventario** | `InventoryView.tsx` (Cards verticales) | `DesktopInventoryGrid.tsx` (Tabla Excel) | `modules/inventory/` |
| **Historial de Ventas** | `HistoryViewMobile.tsx` (Cards) | `HistoryViewDesktop.tsx` (Tabla 1440px) | `modules/history/` |
| **Gestión de Proveedores**| `SuppliersModal.tsx` (ModalSheet) | `DesktopSuppliersView.tsx` (Full View) | `modules/inventory/` |
| **Perfil de Tienda** | `StoreProfileModal.tsx` (ModalSheet) | `DesktopStoreProfileView.tsx` (Full View) | `modules/inventory/` |
| **Configurar Atributos** | `AttributeConfigModal.tsx` | `DesktopAttributeConfigView.tsx` | `modules/inventory/` |
| **Navegación Global** | `Navbar.tsx` + `FloatingCartFAB.tsx` | `DesktopSidebar.tsx` | `components/` |

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

