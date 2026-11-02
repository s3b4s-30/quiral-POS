---
name: quiral-ui-hig
description: >-
  Protocolo de desarrollo y auditoría UI/UX bajo Apple Human Interface Guidelines (HIG) y Tailwind CSS para Quiral POS.
  Úsalo obligatoriamente al crear o modificar vistas, componentes, modales (Bottom Sheets), botones en footer persistente,
  cálculo de safe-areas, espaciado edge-to-edge iOS, control de overflow numérico y temas duales OLED.
---

# Quiral UI/UX & Apple HIG Standards Skill

Esta Skill guía a los agentes de IA y desarrolladores en la implementación y auditoría de la interfaz de usuario de **Quiral POS**. Asegura el cumplimiento riguroso de Apple HIG, ergonomía móvil de mostrador, navegación dual adaptativa y protección absoluta del layout "edge-to-edge" en WebKit iOS (iPhone).

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI (NIVEL DE URGENCIA MÁXIMO)

> [!CAUTION]
> **REGLA DETERMINISTA OBLIGATORIA:**
> Queda **ESTRICTAMENTE PROHIBIDO** alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de forma que rompa el `safe-area-inset-top`, el `backdrop-blur` o los márgenes globales "edge-to-edge" de iOS:
> - **NUNCA** elimines `fixed top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]` de `TopHeader.tsx`.
> - **NUNCA** cambies `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` en `index.html`.
> - **NUNCA** agregues `pt-16`, `pb-32`, `pb-44`, `mb-20` o `h-screen` en `.quiral-scroll-container` ni en las grillas de `InventoryView.tsx`, `PosView.tsx`, `HistoryView.tsx` o `SummaryView.tsx`. El contenedor `.quiral-scroll-container` en `src/index.css` ya calcula `padding-top: var(--quiral-header-offset)` y `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`.

---

## 1. Verificación Previa Obligatoria (Checklist de Inmunidad y Descarte)

Antes de generar o modificar cualquier componente o vista, verifica que tu código cumpla estrictamente:

- [ ] **Respeto a `.quiral-top-header`:** Cabecera fija en `top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]` con contenedor interno `h-14 w-full`.
- [ ] **Sin `pt-16` ni `pb-32`/`pb-44` redundantes:** Las grillas de vistas usan `pb-6` (`pb-20 sm:pb-16` en `PosView` sólo cuando `cartUnits > 0`).
- [ ] **Desmontaje de Navbar en modales:** La `Navbar` se desmonta con `!hasActiveModal` y se oculta vía `body.modal-open nav { display: none !important; }`.
- [ ] **Botones en footer persistente:** Los botones de acción principal en modales («Guardar», «Listo», «Completar venta») deben residir en el slot `footer` de `ModalSheet`, anclados a `env(safe-area-inset-bottom)`.
- [ ] **Lottie con Fallback obligatorio:** Todo `LottiePlayer` debe recibir `animationData={EMPTY_BOX_ANIMATION}` y contar con `DefaultFallbackIcon` para jamás mostrar un bloque en blanco.
- [ ] **Confirmación en acciones destructivas:** Eliminar o modificar registros (como ventas en `HistoryView.tsx`) requiere un Modal de Confirmación obligatorio.
- [ ] **Sin tipografías fijas sobredimensionadas:** Cifras monetarias de métricas deben usar escala fluida `text-lg sm:text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate`.
- [ ] **Nomenclatura formal:** Usar siempre "Cubo" en lugar de "Cubito Cargador".

---

## 2. Patrones de Componentes Estándar

### A. Estructura de Modal / Bottom Sheet (`ModalSheet`)
```tsx
import ModalSheet from "./ModalSheet";

export default function MiModal({ onClose }: Props) {
  return (
    <ModalSheet
      onClose={onClose}
      title="Título del Modal"
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#007aff] text-sm sm:text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform duration-75"
        >
          Guardar cambios
        </button>
      }
    >
      <div className="space-y-4">
        {/* Contenido desplazable independiente */}
      </div>
    </ModalSheet>
  );
}
```

### B. Precios en Tarjetas de Catálogo (`ProductCard`)
```tsx
<div className="flex items-center justify-between min-w-0 gap-2">
  <div className="flex-1 min-w-0 pr-1">
    <h3 className="line-clamp-2 text-sm sm:text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
      {product.name}
    </h3>
  </div>

  <div className="text-right shrink-0 max-w-[55%]">
    <span className="tabular-nums text-sm sm:text-base md:text-lg font-extrabold text-[var(--text-primary)] leading-tight whitespace-nowrap">
      {formatCOP(product.price)}
    </span>
  </div>
</div>
```

---

## 3. Protocolo de Espaciado Edge-to-Edge (Móvil iOS vs Desktop)

Dado que `.quiral-scroll-container` ya incorpora el offset superior (`--quiral-header-offset`) y el offset inferior de la `Navbar` (`calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`):

| Vista | Clase del Contenedor de Scroll | Clase de la Grilla/Sección Interna | Justificación |
| :--- | :--- | :--- | :--- |
| `SummaryView` | `quiral-scroll-container` | `pt-3 pb-6` | Sin `pt-16` ni `pb-32` redundantes. |
| `InventoryView` | `quiral-scroll-container` | `pb-6` | Despeje exacto provisto por `.quiral-scroll-container`. |
| `PosView` | `quiral-scroll-container` | `${cartUnits > 0 ? "pb-20 sm:pb-16" : "pb-6"}` | Despeja `CartSummaryBar` sólo cuando hay ítems en el carrito. |
| `HistoryView` | `quiral-scroll-container` | `pb-6` | Despeje exacto sobre la `Navbar` flotante. |

---

## 4. Control de Calidad al Concluir Cambios de UI

Siempre que termines de editar la interfaz:
1. Comprueba que no existan errores de TypeScript:
   ```bash
   npx tsc --noEmit
   ```
2. Ejecuta la compilación de producción:
   ```bash
   npm run build
   ```
3. Verifica que no haya advertencias de chunks ni desbordamientos en resoluciones de iPhone (375px / 390px) y Desktop (768px+).
