# 🗺️ Mapa de Directorios y Estructura Modular — Quiral POS

> **Ubicación:** `notebook/02_ARQUITECTURA_Y_SISTEMA/02_MAPA_DE_DIRECTORIOS_Y_MODULOS.md`  
> **Ámbito:** Organización de carpetas, arquitectura modular por dominios y convenciones de archivos.

---

## 1. Visión General del Directorio `src/`

La aplicación está organizada bajo una arquitectura modular por dominios de negocio, desacoplando la lógica de datos de la interfaz visual:

```
src/
├── assets/                    # Animaciones Lottie (empty-box.json), iconos y logos
├── components/                # Componentes globales transversales (TopHeader, TopMenu, Navbar, etc.)
├── contexts/                  # Proveedores de estado global (InventoryContext, PosContext, AuthContext)
├── hooks/                     # Custom hooks reutilizables (useIsDesktop, useScrollParentVirtualizer, etc.)
├── lib/                       # Configuración de clientes (supabaseClient.ts, queryClient.ts)
├── modules/                   # 📦 NÚCLEO MODULAR POR DOMINIOS
│   ├── history/               # Dominio de Historial de Ventas y Auditoría
│   ├── inventory/             # Dominio de Gestión de Inventario, Catálogo y Lotes
│   └── pos/                   # Dominio de Punto de Venta y Carrito de Compras
├── services/                  # 🔌 CAPA DE SERVICIOS E I/O (Supabase e IndexedDB)
├── styles/                    # Estilos CSS de paletas de temas (themePalettes.css)
├── types/                     # Tipos de dominio centralizados (domain.ts)
├── utils/                     # Utilidades puras y formateadores (formatters.ts)
└── views/                     # Enrutadores semáforo principales (PosView, InventoryView, etc.)
```

---

## 2. Los Tres Módulos de Dominio (`src/modules/`)

### A. Módulo de Punto de Venta (`src/modules/pos/`)

Centraliza todo lo referente al mostrador, escaneo de artículos, gestión de líneas de carrito y liquidación:

- `PosViewDesktop.tsx`: Estación de trabajo dividida (Split-View): catálogo a la izquierda y ticket lateral permanente a la derecha.
- `PosViewMobile.tsx`: Interfaz táctil móvil optimizada para pulgar con tarjetas de producto y barra flotante.
- `DesktopPosTicket.tsx`: Panel lateral fijo para cobro directo en PC con desglose de totales, descuentos y atajos <kbd>Ctrl+Enter</kbd>.
- `PosProductCard.tsx`: Tarjeta interactiva de producto con selector de lotes y adición rápida.
- `CheckoutSheet.tsx`: Bottom Sheet exclusivo para móvil para liquidar la venta.
- `FloatingCartFAB.tsx` y `CartSummaryBar.tsx`: Componentes flotantes exclusivos para móvil.

### B. Módulo de Inventario (`src/modules/inventory/`)

Gestiona el catálogo maestro, lotes individuales, costos ponderados y configuración de atributos:

- `DesktopInventoryGrid.tsx`: Tabla matricial de alta densidad tipo Excel con navegación por flechas y edición inline.
- `InventoryView.tsx`: Vista vertical móvil de productos con tarjetas expansibles.
- `DesktopProductDrawer.tsx`: Cajón lateral de inspección detallada de producto para PC.
- `DesktopSuppliersView.tsx`: Vista administrativa completa a pantalla completa para gestionar proveedores.
- `DesktopStoreProfileView.tsx`: Configuración y perfil de tienda para PC.
- `DesktopAttributeConfigView.tsx`: Gestor de categorías y atributos dinámicos para PC.
- `InventoryGridRow.tsx`, `EditableGridCell.tsx`, `QuickAddRow.tsx`: Componentes atómicos virtualizados de la tabla Excel.

### C. Módulo de Historial (`src/modules/history/`)

Gestiona la auditoría de ventas, reimpresión de comprobantes, modificación controlada y cierres de caja:

- `HistoryViewDesktop.tsx`: Tabla de auditoría ancha (1440px) con anchos de columna estrictos (`table-fixed`), desglose en grilla de 3 columnas y filtros avanzados.
- `HistoryViewMobile.tsx`: Lista de tarjetas de venta para móvil con soporte táctil.
- `HistoryTableRow.tsx`: Fila memorizada de auditoría con detalles desplegables.
- `SalesPerformanceModal.tsx`: Métricas de ventas del día, ticket promedio y rentabilidad.
- `CycleClosingModal.tsx`: Cierre formal de turno/ciclo de caja registradora.

---

## 3. Capa de Servicios y Almacenamiento (`src/services/`)

Los componentes de React y los contextos **jamás consultan directamente las tablas de Supabase**; todo el I/O se canaliza a través de servicios puros:

- `supabaseInventory.ts`: Consultas de productos, actualización de existencias de lotes, creación de productos y gestión de proveedores.
- `supabaseSales.ts`: Ejecución atómica del RPC `complete_sale`, reconciliación de stock en eliminaciones (`deleteSale`) y cierres de ciclo.
- `supabaseRealtime.ts`: Aislamiento de las suscripciones a canales en tiempo real de PostgreSQL.
- `offlineDb.ts`: Definición de la base de datos Dexie `QuiralPOS_Offline_DB` (`salesQueue`, `cachedProducts`, `cachedSuppliers`).
- `offlineSyncService.ts`: Motor de sincronización en segundo plano con detector de eventos `online`/`offline`.

---

## 4. Enrutadores Semáforo (`src/views/`)

Las vistas en `src/views/` (`PosView.tsx`, `HistoryView.tsx`, `InventoryView.tsx`) no contienen maquetación compleja; actúan como enrutadores declarativos que evalúan `useIsDesktop()` y renderizan el componente adecuado:

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

Esto garantiza que la PWA tenga una única URL `/` mientras entrega una experiencia 100% nativa según el dispositivo.
