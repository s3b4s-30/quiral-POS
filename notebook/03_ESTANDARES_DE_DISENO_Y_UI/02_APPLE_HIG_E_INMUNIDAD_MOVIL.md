# 📱 Apple HIG y Directiva de Inmunidad Móvil iOS — Quiral POS

> **Ubicación:** `notebook/03_ESTANDARES_DE_DISENO_Y_UI/02_APPLE_HIG_E_INMUNIDAD_MOVIL.md`  
> **Ámbito:** Reglas inquebrantables de WebKit iOS (iPhone Safari / PWA Standalone), safe-areas y Bottom Sheets.

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI (NIVEL DE URGENCIA MÁXIMO)

> [!CAUTION]
> **REGLA DETERMINISTA E INVIOLABLE PARA CUALQUIER AGENTE O DESARROLLADOR:**
> Queda **ESTRICTAMENTE PROHIBIDO** alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de forma que degrade el layout base "edge-to-edge" de iOS Safari o PWA Standalone:
>
> 1. **Anclaje Superior y `safe-area-inset-top`:**
>    - `TopHeader` (`.quiral-top-header`) DEBE permanecer como:
>      `fixed top-0 w-full z-50 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]` con `--quiral-header-offset: calc(env(safe-area-inset-top, 0px) + 4rem)` y contenedor interno `h-14 w-full`.
>    - En `index.html`, `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` y `viewport-fit=cover` NO deben modificarse.
>    - **PROHIBIDO** inyectar `pt-16`, `mt-14` o `mt-16` en `.quiral-scroll-container`.
> 2. **Desenfoque de Cristal Translúcido (`backdrop-blur`):**
>    - `TopHeader` mantiene su efecto nativo (`backdrop-filter: blur(12px)` + `color-mix(in srgb, var(--bg-primary) 85%, transparent)`).
> 3. **Prohibición de Márgenes Inferiores Redundantes (`pb-32`, `pb-44`, `mb-20`, `h-screen`):**
>    - `.quiral-scroll-container` en `src/index.css` YA aplica el despeje inferior exacto (`padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`).
>    - Las listas internas usan exclusivamente `pb-6` (`pb-20 sm:pb-16` en `PosView` únicamente cuando `cartUnits > 0`).

---

## 1. Estándares Apple Human Interface Guidelines (HIG)

En la experiencia táctil móvil de mostrador, el usuario maneja el teléfono con una sola mano (ergonomía de pulgar):

### A. Anatomía de Modales y Bottom Sheets (`ModalSheet.tsx`)

1. **Emergencia desde el Fondo:** Los modales se abren como hojas deslizables hacia arriba (_Bottom Sheets_), ancladas con `rounded-t-[2.5rem]`.
2. **Botón de Acción en el Pie Persistente (`footer` slot):**
   - Los botones primarios («Guardar cambios», «Cobrar venta», «Listo») jamás deben alojarse al final del texto scrolleable.
   - Deben residir fijos en el slot `footer` de `ModalSheet`, anclados a `env(safe-area-inset-bottom)` con altura táctil mínima de 48px (`min-h-12`).
3. **Desmontaje Limpio de la Barra de Navegación (`Navbar.tsx`):**
   - Cuando un modal está activo, la `Navbar` inferior se desmonta con `!hasActiveModal` y se oculta mediante la regla CSS `body.modal-open nav { display: none !important; }`.

---

## 2. Resiliencia de Estados Vacíos con Lottie

Todo estado vacío (catálogo sin productos, historial sin ventas, carrito vacío) debe implementar el componente `LottiePlayer` asegurando:

1. Importación directa de la animación vectorizada canónica:
   ```tsx
   import EMPTY_BOX_ANIMATION from "../assets/empty-box.json";
   ```
2. Icono de respaldo obligatorio (`DefaultFallbackIcon` / `fallback`):
   - Si la animación Lottie falla en cargar por cualquier motivo de red, el componente debe mostrar automáticamente el icono SVG vectorial para jamás renderizar un contenedor en blanco roto.
