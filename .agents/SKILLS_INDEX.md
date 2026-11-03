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
│  3. ui-ux-modern-taste  -> Alta Densidad SaaS Desktop, Nitidez & Scroll │
│  4. google-stitch       -> Conexión MCP y Pipeline Google Stitch       │
│  5. stitch-design       -> Traducción Visual Stitch -> Tailwind OLED   │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: INTELIGENCIA TRANSVERSAL, CRAFT Y TESTING RIGUROSO             │
│  6. image-to-code       -> Visión de Mostrador -> React 18 + Tailwind  │
│  7. playwright-cli      -> Automatización E2E (Chromium & Mobile Safari)│
│  8. impeccable          -> Craft UI/UX, Auditoría Automática y Hooks   │
│  9. ui-ux-pro-max       -> Inteligencia de Diseño UI/UX Multidisciplina│
│ 10. ui-styling          -> shadcn/ui, Radix UI & Primitivas Tailwind   │
│ 11. security-audit      -> Auditoría de Vulnerabilidades y RLS Supabase│
│ 12. design-system       -> Arquitectura de Tokens en 3 Capas           │
│ 13. design              -> Hub Integral de Diseño, CIP, Logo e Iconos  │
│ 14. brand               -> Identidad de Marca, Voz y Directrices       │
│ 15. banner-design       -> Banners y Creativos Multiformato            │
│ 16. slides              -> Presentaciones HTML Estratégicas (Chart.js) │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: HABILIDADES OFICIALES ORIGINALES UPSTREAM (Adaptadas a Quiral) │
│ 17. design-taste-frontend -> tasteskill/tasteskill (Anti-Slop V2)      │
│ 18. web-design-guidelines -> tech-leads-club/agent-skills (Vercel A11y)│
│ 19. awesome-design-skills -> bergside/awesome-design-skills (67 Styles)│
│ 20. playwright-skill      -> tech-leads-club/agent-skills (Auto-Runner)│
│ 21. @playwright/mcp       -> Servidor MCP Playwright Oficial Microsoft │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Protocolos de Invocación y Uso para Agentes

### Protocolo 1: Modificación de Vistas o Componentes de UI Móvil

1. **Activar:** [`quiral-ui-hig`](./skills/quiral-ui-hig/SKILL.md), [`impeccable`](./skills/impeccable/SKILL.md) o [`web-design-guidelines`](./skills/web-design-guidelines/SKILL.md).
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

1. **Activar:** [`ui-ux-modern-taste`](./skills/ui-ux-modern-taste/SKILL.md), [`design-taste-frontend`](./skills/design-taste-frontend/SKILL.md), [`quiral-ui-hig`](./skills/quiral-ui-hig/SKILL.md) y [`quiral-pos-engine`](./skills/quiral-pos-engine/SKILL.md).
2. **Consultar:** [`docs/DESKTOP_UI_RULES.md`](../docs/DESKTOP_UI_RULES.md) y [`AGENTS.md`](../AGENTS.md).
3. **Aplicar Estándares:**
   - Desacoplamiento físico estricto mediante `useIsDesktop.ts` (`*Mobile.tsx` vs `*Desktop.tsx`).
   - Lista negra en PC: prohibido importar `ModalSheet`, `CheckoutSheet`, `CartSummaryBar` o `FloatingCartFAB` en archivos `*Desktop.tsx`.
   - Implementar experiencia Keyboard-First tipo Excel en `DesktopInventoryGrid.tsx` y tabla de auditoría en `HistoryViewDesktop.tsx`.
   - Cero doble-scroll (`flex-1 min-h-0 overflow-y-auto`), scrollbars minimalistas `.custom-scrollbar` y ancho de columnas estricto (`table-fixed`).
   - Vistas administrativas completas (`DesktopStoreProfileView`, `DesktopSuppliersView`, `DesktopAttributeConfigView`).
4. **Validar:** `npx tsc --noEmit`, `npm run test:unit`, `npm run build` y `npx playwright test`.

### Protocolo 4: Traducción de Diseños y Capturas Visuales a Código

1. **Activar:** [`image-to-code`](./skills/image-to-code/SKILL.md) (versión upstream `tasteskill/tasteskill`), [`ui-ux-modern-taste`](./skills/ui-ux-modern-taste/SKILL.md) y [`awesome-design-skills`](./skills/awesome-design-skills/SKILL.md).
2. **Consultar:** [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md) y [`docs/DESKTOP_UI_RULES.md`](../docs/DESKTOP_UI_RULES.md).
3. **Aplicar Estándares:**
   - Pipeline de 5 fases: descomposición, tokens Dual OLED, Platform Split, maquetación React 18 + TS, y verificación Exit 0.
   - Tipografía anti-aliased nítida, `.tabular-nums` en montos COP y contrastes profundos.
4. **Validar:** `npx tsc --noEmit`, `npm run test:unit`, `npm run build` y `npx playwright test`.

### Protocolo 5: Automatización, Diagnóstico y Ejecución E2E

1. **Activar:** [`playwright-cli`](./skills/playwright-cli/SKILL.md) o [`playwright-skill`](./skills/playwright-skill/SKILL.md) junto con el servidor MCP `@playwright/mcp`.
2. **Consultar:** [`playwright.config.ts`](../playwright.config.ts) y [`AGENTS.md`](../AGENTS.md).
3. **Aplicar Estándares:**
   - Ejecución autónoma con `npx playwright test` (52/52 tests pasando en Chromium y Mobile Safari).
   - Filtrado preciso por proyecto (`--project="chromium"` o `--project="Mobile Safari iPhone 14 Standalone"`).
   - Diagnóstico con `--debug`, `--trace on` y análisis de selectores ante cambios de layout.
4. **Validar:** Salida 100% Exit 0 innegociable.
