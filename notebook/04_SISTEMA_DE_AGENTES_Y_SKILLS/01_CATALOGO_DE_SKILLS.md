# 📦 Catálogo de Skills y Agentes del Ecosistema — Quiral POS

> **Ubicación:** `notebook/04_SISTEMA_DE_AGENTES_Y_SKILLS/01_CATALOGO_DE_SKILLS.md`  
> **Ámbito:** Inventario exhaustivo de las 21 habilidades operativas divididas en tres niveles (Tiers).

---

## 1. Visión Estructural del Ecosistema de Habilidades

Las habilidades modulares residen en el directorio `.agents/skills/` y dotan a los asistentes de IA de superpoderes especializados para resolver tareas complejas sin improvisación:

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
│ TIER 3: HABILIDADES OFICIALES ORIGINALES UPSTREAM                      │
│ 17. design-taste-frontend -> tasteskill/tasteskill (Anti-Slop V2)      │
│ 18. web-design-guidelines -> tech-leads-club/agent-skills (Vercel A11y)│
│ 19. awesome-design-skills -> bergside/awesome-design-skills (67 Styles)│
│ 20. playwright-skill      -> tech-leads-club/agent-skills (Auto-Runner)│
│ 21. @playwright/mcp       -> Servidor MCP Playwright Oficial Microsoft │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalle de Habilidades por Tier

### Tier 1: Núcleo Arquitectónico Quiral

1. **`quiral-ui-hig` (`.agents/skills/quiral-ui-hig/`):**
   - Protocolo Apple HIG, protección de `TopHeader` y safe-areas iOS, modales `ModalSheet` con botones en el footer.
2. **`quiral-pos-engine` (`.agents/skills/quiral-pos-engine/`):**
   - Transacciones atómicas de venta, mitigación de ventas duplicadas (`saleInFlightRef`), balanceo multi-lote y deduplicación.
3. **`ui-ux-modern-taste` (`.agents/skills/ui-ux-modern-taste/`):**
   - Estándar visual Linear/Vercel en PC, contención de viewport, scrollbars `.custom-scrollbar` y tipografía nítida de mostrador.
4. **`google-stitch` y `stitch-design` (`.agents/skills/google-stitch/`, `stitch-design/`):**
   - Integración con el servidor MCP de Google Stitch para importar pantallas y convertirlas a Tailwind OLED.

### Tier 2: Inteligencia Transversal y Testing

5. **`image-to-code` (`.agents/skills/image-to-code/`):**
   - Pipeline visual en 5 fases para traducir capturas de fallos o bocetos a componentes limpios de React y Tailwind.
6. **`playwright-cli` (`.agents/skills/playwright-cli/`):**
   - Ejecución autónoma de la suite de 52 pruebas E2E con Playwright CLI, gestión de viewports y runbook de fallos.
7. **`security-audit` (`.agents/skills/security-audit/`):**
   - Auditoría de dependencias, escaneo de RLS en Supabase y verificación de secretos.
8. **`impeccable` y `ui-ux-pro-max`:**
   - Craft visual avanzado, refinamiento estético y coherencia en micro-interacciones.

### Tier 3: Frameworks Upstream Oficiales

9. **`design-taste-frontend` (`tasteskill/tasteskill`):**
   - Marco Anti-Slop de ingeniería frontend para erradicar patrones cliché generados por IA.
10. **`web-design-guidelines` (`tech-leads-club/agent-skills`):**
    - Guías oficiales de Vercel para accesibilidad (ARIA), navegación por teclado y anillos de foco visibles.
11. **`awesome-design-skills` (`bergside/awesome-design-skills`):**
    - 67 sistemas de diseño oficiales listos para consulta (`premium`, `sleek`, `enterprise`, `shadcn`, `bento`, etc.).
12. **`@playwright/mcp`:**
    - Servidor MCP oficial de Microsoft configurado en `~/.gemini/config/mcp_config.json` para automatización browser en modo aislado (`--isolated`).
