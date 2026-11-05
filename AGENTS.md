# AGENTS.md — Protocolo Permanente para Asistentes y Desarrolladores

Bienvenido al repositorio de **Quiral POS**. Este documento establece las directivas técnicas, protocolos de gobernanza y estándares operativos obligatorios para cualquier asistente de inteligencia artificial, agente autónomo o desarrollador que inspeccione o modifique esta base de código.

---

## 0. 🛡️ DIRECTIVA DE INMUNIDAD DE UI (NIVEL DE URGENCIA MÁXIMO — INVIOLABLE)

> [!CAUTION]
> **REGLA DETERMINISTA E INQUEBRANTABLE PARA TODO AGENTE, SKILL O ASISTENTE DE IA:**
> Queda **ESTRICTAMENTE PROHIBIDO** alterar `src/App.tsx`, `src/components/TopHeader.tsx`, `src/components/TopMenu.tsx`, `src/index.css` o `index.html` de cualquier forma que degrade o modifique el layout base "edge-to-edge" de iOS Safari / PWA Standalone:
>
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

| Documento                                                                      | Alcance y Contenido Técnico                                                                                                                                                                                                      | Cuándo Consultar                                                                                                                                  |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`notebook/README.md`](./notebook/README.md)                                   | **Base de Conocimiento Centralizada Permanente (99% Invariante):** 7 módulos que cubren visión, arquitectura, estándares UI, catálogo de skills, ingeniería de prompts, reglas 100% Exit 0 y registros de decisiones (ADRs).     | **Lectura obligatoria inicial** para cualquier agente o cuaderno de IA antes de planificar, diseñar o ejecutar cambios en el proyecto.            |
| [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md)                               | **Arquitectura Visual y Sistema de Diseño:** Estándares Apple HIG, temas duales OLED, Bottom Sheets, navegación responsiva (Móvil vs Desktop), safe-areas, márgenes anti-colisión y el **Historial de Descarte**.                | Antes de intervenir vistas, componentes, estilos Tailwind, modales, tipografía o flujos táctiles.                                                 |
| [`docs/DESKTOP_UI_RULES.md`](./docs/DESKTOP_UI_RULES.md)                       | **Arquitectura Platform Split y Ergonomía Desktop:** Desacoplamiento físico de vistas (`*Mobile.tsx` vs `*Desktop.tsx`), lista negra de componentes móviles en PC, cero doble scroll y Keyboard-First.                           | Al intervenir o crear vistas y componentes para escritorio (`>= 768px`).                                                                          |
| [`docs/AGENTS_AND_SKILLS_MANIFESTO.md`](./docs/AGENTS_AND_SKILLS_MANIFESTO.md) | **Manifiesto y Gobierno de Agentes/Skills:** Mapa de ruta humano: qué herramienta usar, cuándo activarla obligatoriamente y qué estilos están prohibidos.                                                                        | Antes de iniciar cualquier tarea o responder en nuevos chats/cuadernos.                                                                           |
| [`QUIRAL_V1.0.1_DOCS.md`](./QUIRAL_V1.0.1_DOCS.md)                             | **Arquitectura Técnica y Datos:** Modelado PostgreSQL en Supabase, políticas RLS multi-tenant, RPC atómico `complete_sale`, sincronización Realtime, lógica multi-lote, tipos de dominio TypeScript y pipeline de build en Vite. | Antes de modificar lógica de estado (`InventoryContext`), consultas Supabase, cálculos comerciales, formateadores o configuración de empaquetado. |
| [`PRODUCT.md`](./PRODUCT.md)                                                   | **Verdad del Producto y Contexto Impeccable:** Definición de usuarios, casos de uso de mostrador, posicionamiento de mercado, capacidades y principios estratégicos.                                                             | Al inicializar contexto de diseño, flujos `/impeccable init` o auditorías de propuesta de valor.                                                  |
| [`DESIGN.md`](./DESIGN.md)                                                     | **Tokens y Especificación Formal Impeccable/Stitch:** Rampa tipográfica Apple HIG, paleta Dual OLED y reglas Do's/Don'ts.                                                                                                        | Durante revisiones de detector Impeccable (`detect`), traducción de pantallas o creación de componentes.                                          |

### Habilidades Especializadas (.agents/skills/)

El ecosistema completo de 16 habilidades operativas de élite reside en [`.agents/SKILLS_INDEX.md`](./.agents/SKILLS_INDEX.md):

- **Núcleo Quiral (Tier 1):** [`quiral-ui-hig`](./.agents/skills/quiral-ui-hig/SKILL.md) (UI/Apple HIG), [`quiral-pos-engine`](./.agents/skills/quiral-pos-engine/SKILL.md) (Inventario, Supabase PostgreSQL Best Practices y Offline-First), [`ui-ux-modern-taste`](./.agents/skills/ui-ux-modern-taste/SKILL.md) (Modern SaaS, Anti-Slop & Desktop Ergonomics), [`google-stitch`](./.agents/skills/google-stitch/SKILL.md) (MCP Stitch y Traducción Dual OLED).
- **Inteligencia Transversal, Craft y Testing (Tier 2):** [`image-to-code`](./.agents/skills/image-to-code/SKILL.md) (Visión Computacional a Código), [`playwright-cli`](./.agents/skills/playwright-cli/SKILL.md) (Automatización E2E Exit 0), [`impeccable`](./.agents/skills/impeccable/SKILL.md) (Dirección de Craft UI/UX y Refinamiento), [`ui-ux-pro-max`](./.agents/skills/ui-ux-pro-max/SKILL.md), [`ui-styling`](./.agents/skills/ui-styling/SKILL.md), [`security-audit`](./.agents/skills/security-audit/SKILL.md), [`design-system`](./.agents/skills/design-system/SKILL.md), [`design`](./.agents/skills/design/SKILL.md), [`brand`](./.agents/skills/brand/SKILL.md).
- **Frameworks Oficiales Upstream y Catálogo Curado (Tier 3):** [`design-taste-frontend`](./.agents/skills/design-taste-frontend/SKILL.md) (`tasteskill/tasteskill` Anti-Slop V2), [`web-design-guidelines`](./.agents/skills/web-design-guidelines/SKILL.md) (`tech-leads-club/agent-skills`), [`awesome-design-skills`](./.agents/skills/awesome-design-skills/SKILL.md) (`bergside/awesome-design-skills` Catálogo Maestro Unificado de 67 Estilos).

---

## 2. Principio de Inviolabilidad del Historial de Descarte

La sección `[Historial de Descarte]` en [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) registra formalmente decisiones tomadas para subsanar defectos en WebKit iOS, PWA standalone y ergonomía de mostrador.

> [!CAUTION]
> **Queda estrictamente prohibido reintroducir patrones, textos o estilos previamente descartados**, tales como:
>
> - Clases de padding redundantes (`pt-16`, `pb-32`, `pb-44`, `mb-20`) dentro de `.quiral-scroll-container` que generen huecos blancos arriba o abajo.
> - Barra inferior (`Navbar`) visible simultáneamente con modales activos.
> - Botones de acción principal alojados al final de contenedores desplazables en vez del `footer` de `ModalSheet`.
> - Tipografías fijas sobredimensionadas (`text-3xl`, `text-2xl` estático) en tarjetas de métricas monetarias.
> - Términos informales o desaprobados (ej. "Cubito Cargador" $\rightarrow$ debe ser siempre "Cubo").
> - Controles duplicados o desbordados de «Modo administrador».
> - Semillas artificiales masivas de ventas (`demo-sale-1..118` / ventas 1000+) en el historial.
> - Ocultamiento cosmético con CSS (`md:hidden`) para componentes móviles en escritorio; se debe usar siempre el **Platform Split** físico mediante `useIsDesktop.ts`.
> - **Íconos de destellos o estrellas tipo IA genérica (`Sparkles`, ✨, glitters):** PROHIBIDO en toda la interfaz. Quiral POS es una herramienta de mostrador seria y profesional; utilizar exclusivamente `<Zap />` de `lucide-react` para acciones inteligentes/rápidas o íconos funcionales directos.
> - **Modales móviles en escritorio (`ModalSheet`, Bottom Sheets táctiles en PC):** PROHIBIDO renderizar modales táctiles angostos para crear o gestionar datos en Desktop (`>= 768px`). Utilizar siempre Vistas Completas o Estaciones de Trabajo Split-Layout (`DesktopNewProductModal`, `DesktopCategoryManagerView`, `DesktopSuppliersView`, `DesktopStoreProfileView`).
> - **Preselección forzada de atributos dinámicos:** PROHIBIDO forzar valores por defecto (`opts[0]`). Todo atributo dinámico es 100% opcional; el usuario debe poder alternarlo (toggle) o desmarcarlo explícitamente sin que contamine el título ni las propiedades del producto.
> - **Contaminación del Banco Global de Catálogo:** PROHIBIDO mutar o inyectar opciones al Banco Maestro (`catalogConfig.attributes`) al crear o modificar atributos de una categoría específica; el alcance debe quedar estrictamente aislado en `categoryAttributeValues`.
> - **Clonación ciega de inventario:** PROHIBIDO invocar `addProduct` de forma inmediata e irreversible desde el botón `<Copy />` de la tabla de inventario. Se debe abrir siempre `DesktopNewProductModal` con los datos precargados para permitir su ajuste antes de registrar.
> - **Exposición de IDs internos o claves crudas en UI:** PROHIBIDO mostrar `{attr.key}` (ej. `chargersubtypes`, `brands`, `powers`) de cara al usuario. La interfaz debe presentar exclusivamente nombres legibles (`attr.label`).
> - **Cierre prematuro de paneles en selección múltiple:** PROHIBIDO cerrar popovers de vinculación de atributos o presets al pulsar un solo chip; deben mantenerse abiertos para posibilitar asociaciones consecutivas fluidas hasta su cierre voluntario con `(X)`.
> - **Inconsistencia de botones y estilos dispersos:** Obligatorio el uso exclusivo de los tokens centralizados de `src/constants/uiButtons.ts`: `BTN_PRIMARY` para acciones principales (guardar, crear, confirmar), `BTN_SECONDARY` para acciones secundarias (`+ Nueva Categoría`, `+ Nuevo Atributo`, presets) y `BTN_TERTIARY` para cancelar o restablecer, garantizando coherencia visual (geometría, hover glow y micro-interacción `active:scale-95`).
> - **Uso de `!important` destructivo en utilidades de texto:** PROHIBIDO aplicar `!important` a clases utilitarias de color como `.text-accent` en `src/styles/themePalettes.css`, ya que inhabilita las utilidades de interacción de Tailwind (`hover:text-white`) provocando ceguera cromática (texto acento sobre fondo acento en hover).
> - **Glassmorfismo y Liquid Glass Blur en escritorio:** En estaciones estáticas secundarias (`DesktopStoreProfileView`, `DesktopSuppliersView`), los paneles estructurales deben usar superficies sólidas adaptables para legibilidad tipográfica. En contraste, las cabeceras pegajosas de catálogo de mostrador (`InventoryView`, `PosViewDesktop`) y la barra flotante de acciones masivas (`DesktopInventoryGrid`) utilizan **Liquid Glass Blur** (`backdrop-blur-xl bg-white/70 dark:bg-black/60 border-b border-gray-200/70 dark:border-white/10`) con controles translúcidos (`backdrop-blur-md`), permitiendo que el catálogo y las tablas de productos se deslicen suavemente por debajo con efecto de cristal esmerilado translúcido de alta gama.
> - **Paddings residuales en escritorio (`pt-[var(--quiral-header-offset)]`):** PROHIBIDO inyectar `pt-[var(--quiral-header-offset,4rem)]` en las estaciones de trabajo de escritorio (`DesktopNewProductModal`, `DesktopStoreProfileView`, etc.), ya que la cabecera móvil `TopHeader` no existe en PC.
> - **Clases oscuras estáticas en componentes de escritorio:** PROHIBIDO codificar `border-white/10`, `bg-black/40`, `bg-white/5` o `text-white` sin selector `dark:`, ya que destruyen la legibilidad y contraste en Modo Claro. Se deben utilizar variables semánticas (`var(--bg-primary)`, `var(--bg-elevated)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)`).
> - **Colores fluorescentes en modo claro:** PROHIBIDO usar colores fluorescentes fijos (`text-[#30d158]`, `text-[#ff9500]`) para stock o métricas en modo claro por bajo contraste (< 3:1). Utilizar siempre variantes duales (`text-emerald-600 dark:text-[#30d158]`, `text-amber-600 dark:text-[#ff9500]`).
> - **Barra flotante de acciones masivas en escritorio (`desktop-bulk-actions-bar`):** Debe renderizarse desacoplada del árbol de scroll mediante `createPortal(bulkBar, document.body)` para erradicar trampas de contexto de apilamiento (`overflow: hidden`, `overflow-y-auto`, `animation`). Capa fija obligatoria con `z-[999]`, glassmorfismo dual estricto (`bg-white/85 border border-gray-200/90 text-gray-900 shadow-2xl backdrop-blur-md` en modo claro y `dark:bg-black/75 dark:border-white/15 dark:text-white dark:shadow-2xl` en modo oscuro) y layout continuo inflexible en 1 sola fila (`flex-nowrap w-max max-w-[95vw]`).

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

### D. Verificación Obligatoria de Compilación y Calidad (100% Exit 0)

Antes de dar por concluida cualquier tarea o realizar un commit en Git, es obligatorio ejecutar la suite de calidad completa y validar salida limpia:

```bash
npx tsc --noEmit
npm run test:unit
npm run build
npx playwright test
```

Los cuatro comandos deben finalizar con código de salida `0`:

1. `npx tsc --noEmit`: Cero errores de TypeScript en todo el proyecto.
2. `npm run test:unit`: 100% de las pruebas unitarias pasando en verde en Vitest (`financialCalculations`, `domainFormatters`, `matrixKeyboardNavigation`).
3. `npm run build`: Compilación de producción limpia en Vite sin advertencias ni errores.
4. `npx playwright test`: 100% de las pruebas E2E pasando en verde (Chromium y Mobile Safari).

---

## 5. Privacidad, Seguridad y Blindaje de Artefactos de IA

1. **Exclusión Estricta en Git (`.gitignore`):**
   - Todos los artefactos temporales de asistentes de IA (`.gemini/`, `gemini-bundle/`, `.cursor/`, `.claude/`, `.cline/`, `ai-scratchpad/`, `ai-context-scratchpad/`), cachés de Python (`__pycache__/`, `*.pyc`), reportes locales de pruebas (`test-results/`, `playwright-report/`, `coverage/`) y logs están permanentemente excluidos del control de versiones.
   - Si se requiere respaldar experimentos de prompts o configuraciones de agentes, se deben alojar en ramas dedicadas aisladas (ej. `ai-context-scratchpad`), **nunca** mezclados en `develop` ni `main`.

2. **Cero Exposición de Secretos o Credenciales de Servicio:**
   - En el código fuente de Quiral POS jamás deben incluirse claves secretas, tokens `service_role` de Supabase ni claves maestras privadas.
   - El cliente utiliza exclusivamente la clave anónima pública (`VITE_SUPABASE_ANON_KEY`) sujeta a las políticas de seguridad a nivel de fila (RLS).

3. **Blindaje de Producción, Cabeceras HTTP y Hardening de Supabase (Fase 5):**
   - En `vercel.json` es obligatorio mantener las cabeceras de endurecimiento HTTP en la ruta `/(.*)`: _Content-Security-Policy (CSP)_, _Strict-Transport-Security (HSTS)_, _X-Frame-Options: DENY_, _X-Content-Type-Options: nosniff_, _Referrer-Policy_ y _Permissions-Policy_.
   - Todas las tablas de PostgreSQL en Supabase deben operar con `rowsecurity = true` y filtros `auth.uid() IS NOT NULL AND is_store_member(store_id)`.
   - Queda prohibido otorgar permisos `EXECUTE` al rol `anon` en funciones RPC `SECURITY DEFINER` internas o de mutación (`handle_new_user`, `seed_demo_store`, `update_my_credentials`). La función `complete_sale` debe operar como `SECURITY INVOKER` con bloqueo pesimista (`FOR UPDATE`).
