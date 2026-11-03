# 🛑 Zonas Sagradas e Intocables del Proyecto — Quiral POS

> **Ubicación:** `notebook/06_REGLAS_RESTRICCIONES_Y_CALIDAD/01_ZONAS_SAGRADAS_E_INTOCABLES.md`  
> **Ámbito:** Restricciones inviolables de seguridad, diseño, código y arquitectura.

---

## 1. Las 5 Zonas Sagradas de Quiral POS

### 🛡️ Zona 1: Cabecera Edge-to-Edge y Safe-Areas de iOS

- **Archivos:** `src/components/TopHeader.tsx`, `src/App.tsx`, `src/index.css`, `index.html`.
- **Regla:** Queda **ESTRICTAMENTE PROHIBIDO** alterar la posición, clase o cálculo de `TopHeader`:
  `fixed top-0 w-full z-50 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]`.
- **Razón:** Modificar esto destruye el efecto nativo de cristal traslúcido en iPhone y causa colisiones de contenido con el _Dynamic Island_ y el notch de Apple.

### 🛡️ Zona 2: Segregación Física Platform Split

- **Archivos:** `src/modules/pos/PosViewDesktop.tsx`, `src/modules/history/HistoryViewDesktop.tsx`, `src/modules/inventory/Desktop*.tsx`.
- **Regla:** **PROHIBIDO** importar componentes táctiles móviles (`ModalSheet`, `CheckoutSheet`, `CartSummaryBar`, `FloatingCartFAB`) en archivos `*Desktop.tsx`.
- **Razón:** Evita fugas de memoria, colisiones de scroll en `window` y deformidades visuales en monitores de PC.

### 🛡️ Zona 3: Seguridad de Credenciales y Multi-Tenant Hermético

- **Archivos:** Todo el código fuente en `src/`.
- **Regla:** **PROHIBIDO** colocar claves `service_role` de Supabase o secretos privados en el cliente. El frontend utiliza exclusivamente la clave anónima pública (`VITE_SUPABASE_ANON_KEY`) sujeta a RLS.
- **Razón:** Exponer el `service_role` permitiría a cualquier usuario saltarse las políticas RLS y acceder a los datos de todas las demás tiendas.

### 🛡️ Zona 4: Candado de Venta en Vuelo (`saleInFlightRef`)

- **Archivos:** `src/modules/pos/DesktopPosTicket.tsx`, `src/modules/pos/CheckoutSheet.tsx`.
- **Regla:** Ningún cobro de venta puede ejecutarse sin activar previamente la referencia sincrónica `saleInFlightRef.current = true` y comprobar que no esté en vuelo.
- **Razón:** En el mostrador es común que el cajero presione dos veces seguidas el botón o presione <kbd>Enter</kbd> repetidamente; el candado evita la duplicación de ventas y descuadre de inventario.

### 🛡️ Zona 5: Tipado TypeScript Estricto sin Escapes

- **Archivos:** Todo archivo `.ts` y `.tsx`.
- **Regla:** **PROHIBIDO** el uso de `@ts-ignore`, `@ts-nocheck` o escapar tipos con `any`.
- **Razón:** Quiral POS requiere determinismo contable absoluto. Todo objeto comercial debe cumplir los contratos definidos en `src/types/domain.ts`.
