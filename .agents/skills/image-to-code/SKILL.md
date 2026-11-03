---
name: image-to-code
description: >-
  Metodología y pipeline de visión computacional para procesar capturas de pantalla de interfaces
  de mostrador, mockups de diseño o reportes de bugs visuales, y traducirlos con fidelidad milimétrica
  a componentes React 18, Tailwind CSS estricto y tokens de Quiral POS respetando el Platform Split.
---

# Image-to-Code: Pipeline de Traducción Visual a Código para Quiral POS

Esta Skill dota al agente de un protocolo sistemático para procesar imágenes, capturas de pantalla de mostrador (ej. `image_e908e2.jpg`), mockups de Figma/Stitch o reportes de defectos visuales, transformándolos directamente en componentes React 18 y estilos Tailwind CSS de calidad de producción.

---

## 1. El Pipeline de 5 Fases (Vision-to-Production)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Inspección y │ ──> │ 2. Extracción de│ ──> │ 3. Detección de │
│ Descomposición  │     │ Tokens y Fuentes│     │ Plataforma Split│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐                             ┌─────────────────┐
│ 5. Validación   │ <────────────────────────── │ 4. Maquetación  │
│ 100% Exit 0     │                             │ React + TS      │
└─────────────────┘                             └─────────────────┘
```

---

### Fase 1: Inspección y Descomposición Estructural

Antes de escribir cualquier línea de código, analiza la captura respondiendo:

1. **Contenedor Principal:** ¿Es una vista completa, un modal, un panel lateral o una tabla de datos?
2. **Distribución de Ejes:** ¿Usa CSS Grid (`grid-cols-12`, `grid-cols-3`) o Flexbox (`flex flex-col`, `flex-row`)?
3. **Flujo de Scroll:** ¿Dónde se aloja el scroll? (Verificar que sea local con `overflow-y-auto` y no afecte el contenedor raíz).
4. **Espacios y Padding:** ¿Existen márgenes redundantes o elementos cortados por anchos insuficientes?

---

### Fase 2: Extracción y Mapeo de Tokens de Diseño Quiral

Traduce visualmente las propiedades de la imagen a las variables del sistema de diseño de Quiral:

| Elemento Visual en la Imagen   | Clase Tailwind / Token Quiral                               | Justificación                    |
| :----------------------------- | :---------------------------------------------------------- | :------------------------------- |
| Fondo de pantalla completo     | `bg-[var(--bg-primary)]` (`#000000` / `#050505`)            | Cumplimiento Dual OLED           |
| Tarjetas y paneles secundarios | `bg-[var(--bg-secondary)]` o `bg-neutral-900/60`            | Elevación visual sutil           |
| Bordes de separación           | `border border-white/5` o `border-white/10`                 | Bordes modernos de 1px           |
| Botones y acentos activos      | `bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]` | Paleta dinámica de tienda        |
| Glow o resaltado sutil         | `shadow-accent-glow` o `bg-[var(--accent-subtle)]`          | Indicadores de foco              |
| Textos numéricos / COP         | `tabular-nums font-mono sm:font-sans font-semibold`         | Evita jitter tipográfico         |
| Scrollbars visibles            | `.custom-scrollbar`                                         | Scroll ultra-delgado minimalista |

---

### Fase 3: Detección y Aislamiento de Plataforma (Platform Split)

Verifica inmediatamente el factor de forma representado en la captura:

#### A. Si la captura es Móvil (`< 768px`, teléfonos):

- **Respeto a la Inmunidad de UI:**
  - `TopHeader` fijo con `pt-[env(safe-area-inset-top)]`.
  - Contenedor `.quiral-scroll-container` (`padding-top: var(--quiral-header-offset)` y `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`).
  - Listas internas usan `pb-6`. Prohibido inyectar `pt-16` o `pb-32`/`pb-44`.
  - Diálogos y formularios se alojan en `ModalSheet.tsx` con botón en `footer`.

#### B. Si la captura es de Escritorio (`>= 768px`, PC / Mostrador):

- **Destino del Código:** Archivos `*Desktop.tsx` (ej. `PosViewDesktop.tsx`, `HistoryViewDesktop.tsx`).
- **Lista Negra de Componentes Móviles:** Prohibido usar `ModalSheet`, `CheckoutSheet`, `CartSummaryBar`, `FloatingCartFAB`.
- **Ticket Lateral Integrado:** El cobro reside en el panel derecho (`DesktopPosTicket.tsx`).
- **Cero Doble-Scroll:** Viewport contenido con `h-[calc(100vh-var(--quiral-header-offset,4rem))]`.

---

### Fase 4: Maquetación en React 18 + TypeScript Estricto

1. **Estructura Declarativa Limpia:**
   - Evitar estilos inline (`style={{...}}`) a menos que sean variables CSS dinámicas.
   - Usar clases de Tailwind puras y combinables.
2. **Tipado Robusto sin Escapes:**
   - Prohibido el uso de `any`, `@ts-ignore` o `@ts-nocheck`.
   - Utilizar las entidades tipadas en `src/types/domain.ts` (`Product`, `Sale`, `CartItem`, `LotStock`).
3. **Formateadores Universales:**
   - En importes monetarios usar `formatCOP(monto)`.
   - En fechas usar `formatShortDate(fecha)` o `formatRelativeDate(fecha)`.
   - En unidades usar `formatUnits(unidades)`.

---

### Fase 5: Protocolo de Validación y Cero Regresiones (100% Exit 0)

Tras implementar los componentes derivados de la imagen:

1. `npx tsc --noEmit`: Confirmar cero errores de tipado.
2. `npm run test:unit`: Validar que las pruebas unitarias sigan en verde.
3. `npm run build`: Validar compilación de producción de Vite.
4. `npx playwright test`: Validar que los flujos E2E de Playwright (Desktop Chromium y Mobile Safari) mantengan 100% de éxito.
