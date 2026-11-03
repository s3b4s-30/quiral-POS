---
name: awesome-design-skills
description: >-
  Catálogo maestro consolidado de 67 sistemas de diseño y lenguajes visuales de alto nivel (typeui.sh & bergside/awesome-design-skills).
  Incluye Apple Premium, Bento Grid, Sleek, Clean, Shadcn, Enterprise, Modern, Neobrutalism, Brutalism, Matrix, Glassmorphism, Paper,
  Editorial, Claymorphism y 50+ estilos documentados. Úsalo como enrutador estético para diseñar, refinar componentes o adoptar
  direcciones visuales sin caer en plantillas genéricas de IA, consultando sus fichas en skills/<estilo>/SKILL.md.
---

# Awesome Design Skills (Catálogo Maestro Unificado de 67 Estilos)

Esta Skill consolida el registro completo de **67 sistemas de diseño y lenguajes visuales** provenientes de [`bergside/awesome-design-skills`](https://github.com/bergside/awesome-design-skills) y `typeui.sh`. Actúa como un **enrutador y catálogo centralizado**, permitiendo a cualquier agente acceder a las especificaciones completas de cualquiera de los 67 estilos alojados en `skills/<estilo>/` sin sobrecargar el registro global de habilidades de Antigravity.

---

## 1. 🛡️ Protocolo de Adaptación a Quiral POS

> [!CAUTION]
> **DIRECTIVA DE INMUNIDAD Y CONVERGENCIA:**
> Al aplicar cualquiera de estos 67 estilos dentro de Quiral POS:
> 1. **Inmunidad de UI Móvil (< 768px):** Jamás alterar `TopHeader` (`fixed top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]`) ni inyectar `pt-16` o `pb-32`/`pb-44` en `.quiral-scroll-container`.
> 2. **Platform Split Inviolable:** Los estilos de alta densidad de escritorio (`enterprise`, `shadcn`, `bento`) pertenecen exclusivamente a archivos `*Desktop.tsx` gobernados por `useIsDesktop.ts`. Prohibido importar `ModalSheet` en PC.
> 3. **Paleta Dual OLED:** Adaptar fondos a `var(--bg-primary)` (`#000000` / `#050505` en oscuro) y respetar variables activas `--accent-*`.
> 4. **Formateo Financiero:** Toda cifra monetaria debe llevar `.tabular-nums` y procesarse con `formatCOP()`.

---

## 2. Mapa y Categorización de los 67 Estilos (`skills/<estilo>/`)

Para aplicar cualquier estilo, el agente debe leer su ficha técnica detallada en:
- Directiva técnica: `.agents/skills/awesome-design-skills/skills/<nombre-estilo>/SKILL.md`
- Justificación y tokens: `.agents/skills/awesome-design-skills/skills/<nombre-estilo>/DESIGN.md`

### Grupo 1: Alta Gama, SaaS y Mostrador POS (Recomendados para Quiral POS)
| Estilo | Ubicación | Enfoque Visual | Caso de Uso en Quiral POS |
| :--- | :--- | :--- | :--- |
| **`premium`** | `skills/premium/` | Inspiración Apple HIG, espaciados milimétricos, lujo sobrio | Modales iOS, tarjetas de métricas, switcher de temas |
| **`sleek`** | `skills/sleek/` | Minimalismo contemporáneo, microinteracciones sutiles | Sidebar desktop, estados hover, tabs de navegación |
| **`enterprise`**| `skills/enterprise/`| Alta densidad de datos, paneles cloud, contraste estricto | Data Grid de Historial de Ventas, balance contable |
| **`shadcn`** | `skills/shadcn/` | Componentes neutros, bordes de 1px de precisión | Modales de confirmación, inputs de texto, formularios |
| **`bento`** | `skills/bento/` | Grillas modulares tipo bento con balance y jerarquía | Vista de Resumen (`SummaryView`), métricas de mostrador |
| **`clean`** | `skills/clean/` | Espacio negativo deliberado, tipografía legible | Vistas de catálogos extensos, formularios limpios |
| **`modern`** | `skills/modern/` | Editorial contemporáneo, balance tipográfico pulido | Fichas técnicas de producto, vistas administrativas |
| **`contemporary`**| `skills/contemporary/`| Bento grids modernos, dark mode nativo, WCAG AAA | Fichas de producto, inventario modular |
| **`matrix`** | `skills/matrix/` | Cyber-dark, datos de alta densidad, estética terminal | Monitor de sincronización offline (Dexie / IndexedDB) |
| **`glassmorphism`**| `skills/glassmorphism/`| Capas translúcidas con `backdrop-blur` calibrado | Menús desplegables sobrepuestos, tooltips |
| **`minimal`** | `skills/minimal/` | Cero adornos, tipografía pura, claridad radical | Tickets térmicos de venta, recibos de mostrador |

### Grupo 2: Expresivos, Editoriales y Texturados
| Estilo | Ubicación | Enfoque Visual |
| :--- | :--- | :--- |
| **`editorial`** | `skills/editorial/` | Inspiración en revistas de alta costura, serif refinada, grillas estructuradas |
| **`paper`** | `skills/paper/` | Textura de papel, diseño impreso, tacto analógico, colores orgánicos |
| **`terracotta`**| `skills/terracotta/`| Superficies cálidas de arcilla, tipografía display marrón-tinta |
| **`mono`** | `skills/mono/` | Enfoque 100% tipografía monoespaciada, alto contraste, densidad hacker |
| **`codex`** | `skills/codex/` | Lienzo radicalmente minimalista, casi acromático, blanco/negro puro |
| **`claude`** | `skills/claude/` | Revista de investigación sobre piedra cálida, pizarra y pergamino |
| **`dramatic`** | `skills/dramatic/` | Contrastes teatrales, composiciones no convencionales de alto impacto |
| **`basic`** | `skills/basic/` | Visual editorial para reportes y libros, jerarquía de lectura natural |

### Grupo 3: Lúdicos, Retro y Anti-Diseño
| Estilo | Ubicación | Enfoque Visual |
| :--- | :--- | :--- |
| **`neobrutalism`**| `skills/neobrutalism/`| Bordes negros sólidos, sombras offset duras, colores vivos |
| **`brutalism`** | `skills/brutalism/` | Estética cruda de concreto arquitectónico, minimalismo funcional |
| **`pacman`** | `skills/pacman/` | Arcade retro de 8 bits, fuentes pixeladas, bordes punteados |
| **`tetris`** | `skills/tetris/` | Bloques geométricos clásicos, colores energéticos, diseño compacto |
| **`sega`** | `skills/sega/` | Tipografía VT323 pixel, esquinas duras 0px, botones chunky pill |
| **`claymorphism`**| `skills/claymorphism/`| Formas 3D suaves y esponjosas que simulan plastilina |
| **`neumorphism`** | `skills/neumorphism/` | Relieves extruidos con sombras interiores y exteriores suaves |
| **`doodle` / `sketch`**| `skills/doodle/`, `sketch/`| Bocetos a mano alzada, tipografías manuscritas, calidez humana |
| **`riso`** | `skills/riso/` | Estética de impresión risográfica en dos tintas sobre papel crema |

### Grupo 4: Atmósferas, Tendencias y Color
| Estilo | Ubicación | Enfoque Visual |
| :--- | :--- | :--- |
| **`cosmic` / `futuristic`**| `skills/cosmic/`, `futuristic/`| Interfaces de ciencia ficción, acentos neón sobre fondos oscuros |
| **`neon`** | `skills/neon/` | Resplandores eléctricos de alta intensidad lumínica |
| **`gradient`** | `skills/gradient/` | Transiciones de color suaves y continuas con profundidad |
| **`vibrant` / `pulse`** | `skills/vibrant/`, `pulse/` | Energía visual dinámica, colores saturados y expresivos |
| **`retro` / `vintage`** | `skills/retro/`, `vintage/` | Nostalgia gráfica de los años 50s-90s, texturas granuladas |
| **`ant` / `corporate`** | `skills/ant/`, `corporate/` | Estructura enterprise sobria para aplicaciones corporativas densas |
| **`flat` / `friendly`** | `skills/flat/`, `friendly/` | Diseño plano bidimensional, colores pastel y elementos redondeados |
| **`storytelling`** | `skills/storytelling/` | Flujos narrativos interactivos para guiar al usuario por experiencias |

*(Para la lista completa de las 67 carpetas individuales, inspecciona el directorio `skills/`).*

---

## 3. Flujo de Trabajo para el Agente

1. **Identificar la Intención de Diseño:** Determinar si la tarea requiere un acabado SaaS de alto nivel (`premium`, `enterprise`, `bento`, `sleek`) o una estética experimental.
2. **Consultar la Carpeta Local:** Leer `.agents/skills/awesome-design-skills/skills/<estilo>/SKILL.md` y `DESIGN.md`.
3. **Mapear a Tailwind y Dual OLED:** Aplicar los tokens sin romper la directiva de inmunidad ni la arquitectura Platform Split.
4. **Verificar Calidad:** Compilación con 100% Exit 0 (`npx tsc --noEmit`, `npm run test:unit`, `npm run build`, `npx playwright test`).
