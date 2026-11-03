---
name: awesome-design-skills
description: >-
  Curated registry of 67 battle-tested design system skills and visual styles from typeui.sh and bergside/awesome-design-skills.
  Includes Apple-inspired Premium, Bento grids, Minimal, Sleek, Shadcn, Enterprise, Modern, Neobrutalism, Brutalism, Matrix,
  Glassmorphism, Paper, Editorial, Claymorphism, Clean, and 50+ other design languages. Use when designing, redesigning,
  styling components, selecting aesthetic directions, or building high-end interfaces.
---

# Awesome Design Skills (67 Design Systems Registry)

Esta Skill integra el repositorio oficial y la colección completa de **67 sistemas de diseño y estilos visuales** de [`bergside/awesome-design-skills`](https://github.com/bergside/awesome-design-skills) (del ecosistema `typeui.sh`), proporcionando fichas técnicas estructuradas (`SKILL.md` + `DESIGN.md`) para gobernar el criterio estético y las decisiones visuales en el desarrollo frontend.

---

## 1. 🛡️ Protocolo de Adaptación a Quiral POS

> [!CAUTION]
> **REGLA DE CONVERGENCIA CON QUIRAL POS:**
> Cuando utilices cualquier estilo o inspiración de esta colección en Quiral POS:
> 1. **Inmunidad de UI Móvil:** El estilo jamás puede alterar el layout de `TopHeader` (`fixed top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]`) ni inyectar `pt-16` o `pb-32`/`pb-44` en `.quiral-scroll-container`.
> 2. **Platform Split Inviolable:** Si se aplican acabados de escritorio de alta densidad (ej. `enterprise`, `shadcn`, `bento`), debe hacerse en archivos `*Desktop.tsx` gobernados por `useIsDesktop.ts`. Queda terminantemente prohibido importar modales móviles (`ModalSheet`, `CheckoutSheet`) en PC.
> 3. **Paleta Dual OLED:** Adaptar los fondos a `var(--bg-primary)` (`#000000` / `#050505`) y respetar las variables de acento activas (`--accent-primary`, `--accent-hover`, `--accent-subtle`).
> 4. **Formateo COP:** Todas las cantidades monetarias deben lucir la clase `.tabular-nums` y procesarse con `formatCOP()`.

---

## 2. Índice de Estilos Disponibles (`skills/`)

Cada estilo reside en su subdirectorio dentro de `skills/<estilo>/` y contiene su propio `SKILL.md` (instrucciones para el agente) y `DESIGN.md` (tokens y justificación de diseño):

| Estilo / Carpeta | Enfoque Visual | Casos de Uso Recomendados en Quiral POS |
| :--- | :--- | :--- |
| **`premium`** | Estética Apple de alta gama, espaciado milimétrico, tipografía refinada | Modales táctiles iOS, tarjetas de métricas ejecutivas, selector de temas |
| **`sleek`** | Minimalismo moderno, líneas limpias, microinteracciones sutiles | Panel de navegación lateral desktop (`DesktopSidebar.tsx`), estados hover |
| **`enterprise`** | Alta densidad de datos, paneles tipo cloud dashboard, contraste estructurado | Auditoría de historial de ventas (`HistoryViewDesktop.tsx`), cierre de ciclo |
| **`shadcn`** | Componentes limpios y utilitarios, neutros profundos, bordes de 1px | Diálogos de confirmación, inputs de texto, formularios de producto |
| **`bento`** | Grillas modulares tipo bento con bloques balanceados y jerarquía clara | Dashboard de resumen (`SummaryView`), analítica de mostrador |
| **`minimal`** | Espacio negativo generoso, tipografía pura, ausencia de adornos innecesarios | Tickets de venta impresos, recibos térmicos, vistas despejadas |
| **`stitch`** | Diseño corporativo limpio para flujos guiados y prototipado rápido | Conexión con prototipos de Google Stitch |
| **`matrix` / `mono`**| Estilo ciberespacial monospace, datos compactos, estética terminal | Monitoreo de sincronización IndexedDB (`salesQueue`), logs técnicos |
| **`glassmorphism`** | Capas translúcidas con desenfoque de fondo (`backdrop-blur`) | Encabezados translúcidos, menús desplegables sobrepuestos |
| **`neobrutalism`** | Bordes negros marcados, contrastes vivos, tipografía de impacto | Promociones flash de mostrador, alertas visuales críticas |
| **`contemporary`** | Bento grids modernos, soporte nativo dark mode, accesibilidad WCAG | Rediseño de componentes de inventario y fichas de producto |

*Para explorar los 67 estilos completos, consulta [`README.md`](./README.md) y [`skills/index.json`](./skills/index.json).*

---

## 3. Modo de Empleo por el Agente

1. **Seleccionar el estilo** adecuado para la tarea (ej. `premium` para mostrador móvil o `enterprise`/`sleek` para escritorio).
2. **Consultar la carpeta específica:** Leer `skills/<estilo>/SKILL.md` y `skills/<estilo>/DESIGN.md`.
3. **Extraer tokens y aplicarlos:** Mapear los espaciados, bordes y tipografías a las utilidades de Tailwind CSS de Quiral POS.
4. **Validar:** Ejecutar la suite de calidad obligatoria (`npx tsc --noEmit`, `npm run test:unit`, `npm run build`, `npx playwright test`) con 100% Exit 0.
