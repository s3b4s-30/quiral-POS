# SKILLS_INDEX.md — Registro Oficial del Ecosistema de Habilidades (.agents/skills/)

**Proyecto:** Quiral POS (PWA v1.0.1)  
**Entorno de Agentes:** Google Antigravity (AGY)  
**Ubicación:** `.agents/skills/`  
**Documentos Rectores:** [`AGENTS.md`](../AGENTS.md) · [`.cursorrules`](../.cursorrules) · [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md) · [`QUIRAL_V1.0.1_DOCS.md`](../QUIRAL_V1.0.1_DOCS.md) · [`PRODUCT.md`](../PRODUCT.md) · [`DESIGN.md`](../DESIGN.md) · [`docs/DESKTOP_UI_RULES.md`](../docs/DESKTOP_UI_RULES.md)

---

## 0. 🛡️ Directiva Global de Inmunidad de UI para Todas las Skills

> [!CAUTION]
> Toda Skill ejecutada en este workspace está subordinada a la **Directiva de Inmunidad de UI** definida en [`AGENTS.md`](../AGENTS.md) y [`.cursorrules`](../.cursorrules):
>
> - **PROHIBIDO** alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de manera que afecte el `safe-area-inset-top`, el `backdrop-blur` del encabezado o los márgenes "edge-to-edge" de iOS.
> - **PROHIBIDO** agregar `pt-16`, `pb-32`, `pb-44`, `mb-20` o `h-screen` en las vistas desplazables (`InventoryView`, `PosView`, `HistoryView`, `SummaryView`).
> - **PROHIBIDO** importar componentes táctiles móviles (`ModalSheet`, `CheckoutSheet`, `CartSummaryBar`, `FloatingCartFAB`) en archivos `*Desktop.tsx`.

---

## 1. Visión General del Ecosistema

El directorio `.agents/skills/` aloja las capacidades modulares que extienden el comportamiento de los agentes de IA dentro de Quiral POS:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ECOSISTEMA DE SKILLS — QUIRAL POS                    │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 1: NÚCLEO ARQUITECTÓNICO QUIRAL (Específico del Proyecto)         │
│  1. quiral-ui-hig       -> Apple HIG, Dual OLED, Inmunidad iOS SafeArea│
│  2. quiral-pos-engine   -> Inventario Multi-Lote, CRUD Ventas, Supabase│
│  3. google-stitch       -> Conexión MCP y Pipeline Google Stitch       │
│  4. stitch-design       -> Traducción Visual Stitch -> Tailwind OLED   │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: INTELIGENCIA TRANSVERSAL Y CRAFT (Diseño, Hooks y Seguridad)   │
│  5. impeccable          -> Craft UI/UX, Auditoría Automática y Hooks   │
│  6. ui-ux-pro-max       -> Inteligencia de Diseño UI/UX Multidisciplina│
│  7. ui-styling          -> shadcn/ui, Radix UI & Primitivas Tailwind   │
│  8. security-audit      -> Auditoría de Vulnerabilidades y RLS Supabase│
│  9. design-system       -> Arquitectura de Tokens en 3 Capas           │
│ 10. design              -> Hub Integral de Diseño, CIP, Logo e Iconos  │
│ 11. brand               -> Identidad de Marca, Voz y Directrices       │
│ 12. banner-design       -> Banners y Creativos Multiformato            │
│ 13. slides              -> Presentaciones HTML Estratégicas (Chart.js) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Protocolos de Invocación y Uso para Agentes

### Protocolo 1: Modificación de Vistas o Componentes de UI Móvil

1. **Activar:** [`quiral-ui-hig`](./skills/quiral-ui-hig/SKILL.md) e [`impeccable`](./skills/impeccable/SKILL.md).
2. **Consultar:** [`AGENTS.md`](../AGENTS.md) y [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md).
3. **Aplicar Estándares:**
   - Respetar inmutabilidad de `TopHeader` (`fixed top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]`).
   - No añadir `pt-16` ni `pb-32` / `pb-44` en las grillas internas de las vistas (usar `pb-6`).
   - Botón de acción en el `footer` de `ModalSheet` con safe-areas.
   - `LottiePlayer` con `EMPTY_BOX_ANIMATION` y fallback garantizado.
4. **Validar:** `npx tsc --noEmit`, `npm run test:unit` y `npm run build`.

### Protocolo 2: Modificación de Inventario, Carrito, Historial o Supabase

1. **Activar:** [`quiral-pos-engine`](./skills/quiral-pos-engine/SKILL.md).
2. **Consultar:** [`QUIRAL_V1.0.1_DOCS.md`](../QUIRAL_V1.0.1_DOCS.md).
3. **Aplicar Estándares:**
   - Candado sincrónico `saleInFlightRef` y `deduplicateSales` en ventas.
   - Modal de Confirmación obligatorio antes de eliminar (`deleteSale`) o modificar (`updateSale`) ventas en `HistoryView.tsx`.
   - Distribución determinista de lotes y formateo estricto con `formatCOP` y `.tabular-nums`.
4. **Validar:** `npx tsc --noEmit`, `npm run test:unit` y `npm run build`.

### Protocolo 3: Estación de Trabajo Desktop (`>= 768px`) y Platform Split

1. **Activar:** [`quiral-ui-hig`](./skills/quiral-ui-hig/SKILL.md) y [`quiral-pos-engine`](./skills/quiral-pos-engine/SKILL.md).
2. **Consultar:** [`docs/DESKTOP_UI_RULES.md`](../docs/DESKTOP_UI_RULES.md) y [`AGENTS.md`](../AGENTS.md).
3. **Aplicar Estándares:**
   - Desacoplamiento físico estricto mediante `useIsDesktop.ts` (`*Mobile.tsx` vs `*Desktop.tsx`).
   - Lista negra en PC: prohibido importar `ModalSheet`, `CheckoutSheet`, `CartSummaryBar` o `FloatingCartFAB` en archivos `*Desktop.tsx`.
   - Implementar experiencia Keyboard-First tipo Excel en `DesktopInventoryGrid.tsx` y tabla de auditoría en `HistoryViewDesktop.tsx`.
   - Cero doble-scroll (`flex-1 min-h-0 overflow-y-auto`), ancho de columnas estricto y vistas administrativas completas (`DesktopStoreProfileView`, `DesktopSuppliersView`, `DesktopAttributeConfigView`).
4. **Validar:** `npx tsc --noEmit`, `npm run test:unit`, `npm run build` y `npx playwright test`.
