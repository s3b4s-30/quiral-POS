# 📦 Catálogo de Skills y Agentes del Ecosistema — Quiral POS

> **Ubicación:** `notebook/04_SISTEMA_DE_AGENTES_Y_SKILLS/01_CATALOGO_DE_SKILLS.md`  
> **Ámbito:** Inventario exhaustivo y gobernanza del ecosistema consolidado de 16 habilidades de élite divididas en tres niveles (Tiers).

---

## 1. Visión Estructural del Ecosistema Consolidado

Las habilidades modulares residen en el directorio `.agents/skills/` y dotan a los asistentes de IA de capacidades especializadas para resolver tareas complejas sin improvisación ni sobrecarga de tokens:

```
┌────────────────────────────────────────────────────────────────────────┐
│             ECOSISTEMA DE SKILLS CONSOLIDADO — QUIRAL POS              │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 1: NÚCLEO ARQUITECTÓNICO QUIRAL (Específico del Proyecto)         │
│  1. quiral-ui-hig       -> Apple HIG, Dual OLED, Inmunidad iOS SafeArea│
│  2. quiral-pos-engine   -> Supabase PostgreSQL Best Practices, RLS,    │
│                            Offline-First (TanStack Query + Dexie),     │
│                            Inventario Multi-Lote, RPC Atómico Ventas   │
│  3. ui-ux-modern-taste  -> Alta Densidad SaaS Desktop (Linear/Vercel), │
│                            Principios Anti-Slop (Anti-IA Genérica),    │
│                            Nitidez HD y Scrollbars Sleek               │
│  4. google-stitch       -> Conexión MCP y Traducción Visual Stitch a   │
│                            Tailwind Dual OLED (Consolida stitch-design)│
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: INTELIGENCIA TRANSVERSAL, CRAFT UI/UX Y TESTING RIGUROSO       │
│  5. image-to-code       -> Visión de Mostrador / Diseños -> React + TS │
│  6. playwright-cli      -> Automatización E2E (Chromium & Mobile Safari)│
│  7. impeccable          -> Dirección de Craft UI/UX, Heurísticas y     │
│                            Refinamiento Profesional de Interfaces      │
│  8. ui-ux-pro-max       -> Inteligencia de Diseño UI/UX Multidisciplina│
│  9. ui-styling          -> shadcn/ui, Radix UI & Primitivas Tailwind   │
│ 10. security-audit      -> Pentesting, OWASP, Auditoría de RLS y Auth  │
│ 11. design-system       -> Arquitectura de Tokens en 3 Capas           │
│ 12. design              -> Hub Integral de Diseño, CIP, Logo e Iconos  │
│ 13. brand               -> Identidad de Marca, Voz y Directrices       │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: HABILIDADES OFICIALES UPSTREAM Y CATÁLOGO CURADO               │
│ 14. design-taste-frontend -> tasteskill/tasteskill (Anti-Slop V2)      │
│ 15. web-design-guidelines -> tech-leads-club/agent-skills (Vercel A11y)│
│ 16. awesome-design-skills -> bergside/awesome-design-skills (Catálogo  │
│                              Maestro de 67 Estilos en skills/<estilo>/)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalle de Habilidades por Tier

### Tier 1: Núcleo Arquitectónico Quiral

1. **`quiral-ui-hig` (`.agents/skills/quiral-ui-hig/`):**
   - Protocolo Apple HIG, protección inquebrantable de `TopHeader` y safe-areas iOS, modales `ModalSheet` con botones en el footer.
2. **`quiral-pos-engine` (`.agents/skills/quiral-pos-engine/`):**
   - Transacciones atómicas de venta (`complete_sale`), candado sincrónico en vuelo (`saleInFlightRef`), Supabase PostgreSQL Best Practices (RLS `TO authenticated`, `WITH CHECK`, `security_invoker = true`, bloqueo pesimista `FOR UPDATE`), arquitectura Offline-First (TanStack Query + Dexie.js), balanceo multi-lote y formateo financiero COP.
3. **`ui-ux-modern-taste` (`.agents/skills/ui-ux-modern-taste/`):**
   - Estándar visual Linear/Vercel/Raycast en PC, principios Anti-Slop (cero clichés de IA genérica), contención de viewport 100%, scrollbars ultra-delgados `.custom-scrollbar` y tipografía nítida `.antialiased-hd`.
4. **`google-stitch` (`.agents/skills/google-stitch/`):**
   - Integración con el servidor MCP de Google Stitch para importar especificaciones visuales y convertirlas a Tailwind Dual OLED respetando la inmunidad móvil. Consolida la antigua `stitch-design`.

### Tier 2: Inteligencia Transversal, Craft y Testing

5. **`image-to-code` (`.agents/skills/image-to-code/`):**
   - Pipeline visual para traducir capturas de fallos, fotos de mostrador o bocetos a componentes limpios de React 18 y Tailwind CSS.
6. **`playwright-cli` (`.agents/skills/playwright-cli/`):**
   - Ejecución autónoma y depuración de la suite de 52 pruebas E2E con Playwright CLI (Chromium y Mobile Safari iPhone 14 Standalone) bajo el estándar 100% Exit 0.
7. **`impeccable` (`.agents/skills/impeccable/`):**
   - Dirección de craft UI/UX de clase mundial: comandos de auditoría (`critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `animate`, `colorize`, `typeset`).
8. **`ui-ux-pro-max` (`.agents/skills/ui-ux-pro-max/`):**
   - Inteligencia de diseño con perfiles de razonamiento, paletas, emparejamientos tipográficos y heurísticas UX.
9. **`ui-styling` (`.agents/skills/ui-styling/`):**
   - Componentes accesibles con shadcn/ui, primitivas de Radix UI y maquetación con Tailwind CSS.
10. **`security-audit` (`.agents/skills/security-audit/`):**
    - Pentesting, análisis de vulnerabilidades, endurecimiento de cabeceras CSP, auditoría de políticas RLS y protección de sesiones.
11. **`design-system` (`.agents/skills/design-system/`):**
    - Arquitectura de tokens en 3 capas (primitivos $\rightarrow$ semánticos $\rightarrow$ componentes).
12. **`design` y `brand` (`.agents/skills/design/`, `brand/`):**
    - Identidad visual de Quiral POS, voz de marca y manual de estilo.

### Tier 3: Frameworks Upstream Oficiales y Catálogo Curado

13. **`design-taste-frontend` (`tasteskill/tasteskill`):**
    - Marco Anti-Slop de ingeniería frontend oficial para erradicar patrones predecibles generados por IA, inspeccionando el DOM real.
14. **`web-design-guidelines` (`tech-leads-club/agent-skills`):**
    - Reglas oficiales de diseño web y accesibilidad de Vercel Labs.
15. **`awesome-design-skills` (`bergside/awesome-design-skills`):**
    - Catálogo maestro unificado de 67 sistemas de diseño alojados en `skills/<estilo>/` (Apple Premium, Bento, Sleek, Clean, Shadcn, Enterprise, Matrix, Glassmorphism, etc.), actuando como enrutador estético sin saturar los tokens del entorno.
