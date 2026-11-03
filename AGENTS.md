# AGENTS.md — Protocolo Permanente para Asistentes y Desarrolladores

Bienvenido al repositorio de **Quiral POS**. Este documento establece las directivas técnicas, protocolos de gobernanza y estándares operativos obligatorios para cualquier asistente de inteligencia artificial, agente autónomo o desarrollador que inspeccione o modifique esta base de código.

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI (NIVEL DE URGENCIA MÁXIMO — INVIOLABLE)

> [!CAUTION]
> **REGLA DETERMINISTA E INQUEBRANTABLE PARA TODO AGENTE, SKILL O ASISTENTE DE IA:**
> Queda **ESTRICTAMENTE PROHIBIDO** alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de cualquier forma que degrade o modifique el layout base "edge-to-edge" de iOS Safari / PWA Standalone:
> 1. **Anclaje Superior y `safe-area-inset-top` Intocable:**
>    - El encabezado superior (`TopHeader` / `.quiral-top-header`) DEBE permanecer como `fixed top-0 w-full z-50 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]` con `--quiral-header-offset: calc(env(safe-area-inset-top, 0px) + 4rem)` y contenedor interno `h-14 w-full`.
>    - En `index.html`, `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` y `viewport-fit=cover` NO deben cambiarse a `black-translucent` ni eliminarse.
>    - **PROHIBIDO** agregar clases intrusas como `pt-16`, `mt-14`, `mt-16` o márgenes superiores adicionales a `.quiral-scroll-container` en las vistas (`InventoryView`, `PosView`, `HistoryView`, `SummaryView`, `App.tsx`), ya que `.quiral-scroll-container` ya gestiona `padding-top: var(--quiral-header-offset)`.
> 2. **Desenfoque Translúcido (`backdrop-blur`) Protegido:**
>    - El `TopHeader` (`.quiral-top-header`) mantiene su efecto de cristal nativo (`backdrop-filter: blur(12px)` + `color-mix(in srgb, var(--bg-primary) 85%, transparent)`). Ningún agente puede desactivar este `backdrop-blur` ni sobreponer capas que rompan el flujo "edge-to-edge".
> 3. **Prohibición de Paddings/Márgenes Inferiores Redundantes (`pb-32`, `pb-44`, `mb-20`, `h-screen`):**
>    - `.quiral-scroll-container` en `src/index.css` YA aplica el despeje inferior exacto (`padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)`).
>    - **PROHIBIDO** inyectar `pb-32`, `pb-44`, `mb-20` o `h-screen` dentro de las secciones de productos/ventas en `InventoryView.tsx`, `HistoryView.tsx`, `SummaryView.tsx` o `PosView.tsx`. Las listas internas deben usar exclusivamente `pb-6` (o `pb-20 sm:pb-16` en `PosView` únicamente cuando `cartUnits > 0`).
> 4. **Resiliencia de Empty States (`LottiePlayer`):**
>    - Todo estado vacío que utilice `LottiePlayer` debe importar directamente `EMPTY_BOX_ANIMATION` (`src/assets/empty-box.json`) y conservar el ícono vectorial de respaldo (`DefaultFallbackIcon` / `fallback`) para jamás renderizar contenedores en blanco.

---

## 1. Documentos de Referencia Obligatoria (Fuentes de Verdad)

Antes de planificar, sugerir o ejecutar cualquier modificación en el proyecto, **es imperativo consultar los documentos rectores**:

| Documento | Alcance y Contenido Técnico | Cuándo Consultar |
| :--- | :--- | :--- |
| [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) | **Arquitectura Visual y Sistema de Diseño:** Estándares Apple HIG, temas duales OLED, Bottom Sheets, navegación responsiva (Móvil vs Desktop), safe-areas, márgenes anti-colisión y el **Historial de Descarte**. | Antes de intervenir vistas, componentes, estilos Tailwind, modales, tipografía o flujos táctiles. |
| [`QUIRAL_V1.0.1_DOCS.md`](./QUIRAL_V1.0.1_DOCS.md) | **Arquitectura Técnica y Datos:** Modelado PostgreSQL en Supabase, políticas RLS multi-tenant, RPC atómico `complete_sale`, sincronización Realtime, lógica multi-lote, tipos de dominio TypeScript y pipeline de build en Vite. | Antes de modificar lógica de estado (`InventoryContext`), consultas Supabase, cálculos comerciales, formateadores o configuración de empaquetado. |
| [`PRODUCT.md`](./PRODUCT.md) | **Verdad del Producto y Contexto Impeccable:** Definición de usuarios, casos de uso de mostrador, posicionamiento de mercado, capacidades y principios estratégicos. | Al inicializar contexto de diseño, flujos `/impeccable init` o auditorías de propuesta de valor. |
| [`DESIGN.md`](./DESIGN.md) | **Tokens y Especificación Formal Impeccable/Stitch:** Rampa tipográfica Apple HIG, paleta Dual OLED y reglas Do's/Don'ts. | Durante revisiones de detector Impeccable (`detect`), traducción de pantallas o creación de componentes. |

### Habilidades Especializadas (.agents/skills/)
El ecosistema completo de habilidades operativas reside en [`.agents/SKILLS_INDEX.md`](./.agents/SKILLS_INDEX.md):
- **Núcleo Quiral (Tier 1):** [`quiral-ui-hig`](./.agents/skills/quiral-ui-hig/SKILL.md) (UI/Apple HIG), [`quiral-pos-engine`](./.agents/skills/quiral-pos-engine/SKILL.md) (Inventario y Supabase), [`google-stitch`](./.agents/skills/google-stitch/SKILL.md) (MCP Stitch), [`stitch-design`](./.agents/skills/stitch-design/SKILL.md) (Diseño Stitch).
- **Inteligencia Transversal y Craft (Tier 2):** [`impeccable`](./.agents/skills/impeccable/SKILL.md) (Craft UI/UX y Hooks), [`ui-ux-pro-max`](./.agents/skills/ui-ux-pro-max/SKILL.md), [`ui-styling`](./.agents/skills/ui-styling/SKILL.md), [`security-audit`](./.agents/skills/security-audit/SKILL.md), [`design-system`](./.agents/skills/design-system/SKILL.md), [`design`](./.agents/skills/design/SKILL.md), [`brand`](./.agents/skills/brand/SKILL.md), [`banner-design`](./.agents/skills/banner-design/SKILL.md), [`slides`](./.agents/skills/slides/SKILL.md).

---

## 2. Principio de Inviolabilidad del Historial de Descarte

La sección `[Historial de Descarte]` en [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) registra formalmente decisiones tomadas para subsanar defectos en WebKit iOS, PWA standalone y ergonomía de mostrador.

> [!CAUTION]
> **Queda estrictamente prohibido reintroducir patrones, textos o estilos previamente descartados**, tales como:
> - Clases de padding redundantes (`pt-16`, `pb-32`, `pb-44`, `mb-20`) dentro de `.quiral-scroll-container` que generen huecos blancos arriba o abajo.
> - Barra inferior (`Navbar`) visible simultáneamente con modales activos.
> - Botones de acción principal alojados al final de contenedores desplazables en vez del `footer` de `ModalSheet`.
> - Tipografías fijas sobredimensionadas (`text-3xl`, `text-2xl` estático) en tarjetas de métricas monetarias.
> - Términos informales o desaprobados (ej. "Cubito Cargador" $\rightarrow$ debe ser siempre "Cubo").
> - Controles duplicados o desbordados de «Modo administrador».
> - Semillas artificiales masivas de ventas (`demo-sale-1..118` / ventas 1000+) en el historial.

---

## 3. Protocolo de Resolución de Conflictos

Si una instrucción del usuario o un nuevo requerimiento entra en conflicto con la **Directiva de Inmunidad de UI**, [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) o [`QUIRAL_V1.0.1_DOCS.md`](./QUIRAL_V1.0.1_DOCS.md):
1. **Detención inmediata:** Detén la ejecución de la parte afectada.
2. **Explicación técnica:** Notifica al usuario detallando la regla confirmada y la contradicción detectada.
3. **Presentación de alternativas:** Expón las opciones viables y su impacto en el sistema.
4. **Decisión del usuario:** Espera la instrucción expresa del usuario antes de proceder.
5. **Actualización de documentación:** Si el usuario decide cambiar la regla, actualiza [`AGENTS.md`](./AGENTS.md), [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) o [`QUIRAL_V1.0.1_DOCS.md`](./QUIRAL_V1.0.1_DOCS.md) inmediatamente y elimina la opción anterior del código.

---

## 4. Estándares Operativos y Control de Calidad

### A. Tipado TypeScript Estricto
- Queda prohibido el uso de `@ts-ignore`, `@ts-nocheck` o el escape deliberado con `any`.
- Los tipos del dominio residen centralizados en `src/types/domain.ts`. Cualquier nueva entidad debe tiparse formalmente allí.

### B. Seguridad Multi-Tenant y Prevención de Ventas Duplicadas
- Toda mutación o consulta a Supabase debe aislarse mediante el identificador de tienda (`store_id`) y someterse a las políticas RLS (`is_store_member`).
- `completeSale` debe protegerse con candado sincrónico en vuelo (`saleInFlightRef`) y deduplicación por `id` y `saleNumber` (`deduplicateSales`).
- La modificación (`updateSale`) y eliminación (`deleteSale`) de ventas desde `HistoryView.tsx` exigen siempre un **Modal de Confirmación obligatorio** y reconciliación determinista del stock de lotes.

### C. Lógica de Inventario y Formateo
- Las existencias totales de un producto deben reflejar determinísticamente la suma exacta de sus lotes individuales.
- El ajuste de stock maestro en `InventoryContext` debe añadir al lote con mayor cantidad y sustraer del lote con mayor stock disponible, sin permitir saldos negativos.
- Todos los precios y fechas deben procesarse mediante los formateadores universales de `src/utils/formatters.ts` (`formatCOP`, `formatUnits`, `formatShortDate`, etc.) y lucir la clase CSS `.tabular-nums`.

### D. Verificación Obligatoria de Compilación
Antes de dar por concluida cualquier tarea, es obligatorio ejecutar la suite de compilación y validar salida limpia:
```bash
npx tsc --noEmit
npm run build
```
Ambos comandos deben finalizar con código de salida `0`, cero errores de TypeScript y cero advertencias de exceso de tamaño de chunk en Vite.
