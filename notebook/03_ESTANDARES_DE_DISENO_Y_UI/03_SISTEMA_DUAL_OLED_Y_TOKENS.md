# 🎨 Sistema de Diseño Dual OLED y Tokens de Acento — Quiral POS

> **Ubicación:** `notebook/03_ESTANDARES_DE_DISENO_Y_UI/03_SISTEMA_DUAL_OLED_Y_TOKENS.md`  
> **Ámbito:** Paleta de colores, tokens CSS dinámicos, contraste visual y elevación.

---

## 1. La Filosofía Visual Dual OLED (Linear / Vercel Aesthetic)

En Quiral POS, el diseño no es un adorno cosmético; es una herramienta de productividad para el mostrador:

- **Fondo Negro Puro (OLED Black):** La base del sistema en modo oscuro es `#000000` / `#050505` (`var(--bg-primary)`), ahorrando energía en pantallas OLED de teléfonos y maximizando el contraste para evitar fatiga ocular.
- **Superficies Secundarias Calibradas:** Paneles de trabajo, barras laterales y tarjetas utilizan `var(--bg-secondary)` (`#0d0d0d` a `#121212`).
- **Bordes de Precisión de 1px:** Delimitación quirúrgica mediante `border border-white/5` o `border-white/10` (en modo oscuro) y `border-black/5` (en modo claro), eliminando sombras pesadas o bordes toscos.

---

## 2. Paletas de Acento Dinámicas (`themePalettes.css`)

Cada tienda puede seleccionar su color corporativo principal sin alterar el código de la aplicación. El sistema inyecta variables CSS dinámicas que se propagan a todos los componentes:

| Paleta de Acento                       | Tono Primario (`--accent-primary`) | Hover (`--accent-hover`) | Fondo Sutil (`--accent-subtle`) |
| :------------------------------------- | :--------------------------------- | :----------------------- | :------------------------------ |
| **Azul (Apple Blue - Predeterminada)** | `#007aff`                          | `#0062cc`                | `rgba(0, 122, 255, 0.12)`       |
| **Esmeralda (Emerald Green)**          | `#10b981`                          | `#059669`                | `rgba(16, 185, 129, 0.12)`      |
| **Púrpura (Royal Purple)**             | `#8b5cf6`                          | `#7c3aed`                | `rgba(139, 92, 246, 0.12)`      |
| **Naranja / Ámbar (Warm Amber)**       | `#f59e0b`                          | `#d97706`                | `rgba(245, 158, 11, 0.12)`      |
| **Rosa / Fucsia (Electric Rose)**      | `#f43f5e`                          | `#e11d48`                | `rgba(244, 63, 94, 0.12)`       |

### Clases de Utilidad de Acento:

- `.bg-accent-primary`: Fondo con el color de acento activo.
- `.text-accent-primary`: Texto destacado con el color corporativo.
- `.border-accent-primary`: Borde activo para selecciones o foco.
- `.shadow-accent-glow`: Resplandor suave para resaltar botones de venta o estados activos sin deslumbrar.
- `.bg-gradient-accent`: Gradiente sutil para cabeceras de tickets o badges promocionales.

---

## 3. Lista de Exclusiones y Veto de Estilos (Anti-Slop)

> [!CAUTION]
> **ESTILOS ESTRICTAMENTE PROHIBIDOS EN QUIRAL POS:**
>
> 1. ❌ **Prohibido el "AI Purple/Blue" Slop:** No generar fondos con manchas gigantescas de gradientes morados desenfocados que parecen plantillas genéricas de IA.
> 2. ❌ **Prohibido el Glassmorphism Pesado:** Queda vetado el uso indiscriminado de `backdrop-blur-2xl` y transparencias translúcidas en tablas o áreas de datos; el texto numérico pierde legibilidad.
> 3. ❌ **Prohibido el "Cards inside cards inside cards":** En pantallas densas, la información se agrupa mediante bordes delgados (`divide-y`, `border-t`) y espaciado negativo, no empaquetando tarjetas dentro de más tarjetas.
> 4. ❌ **Prohibidos los Emojis como Iconografía:** Prohibido meter emojis (`🛒`, `📦`, `💵`) en botones o textos de interfaz; toda la iconografía debe ser vectorial limpia mediante `lucide-react`.
