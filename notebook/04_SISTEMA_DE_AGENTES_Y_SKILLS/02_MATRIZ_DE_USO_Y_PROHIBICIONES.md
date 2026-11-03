# ⚖️ Matriz de Uso de Skills y Reglas de Prohibición — Quiral POS

> **Ubicación:** `notebook/04_SISTEMA_DE_AGENTES_Y_SKILLS/02_MATRIZ_DE_USO_Y_PROHIBICIONES.md`  
> **Ámbito:** Guía de decisión obligatoria para agentes y desarrolladores: qué usar, cuándo y qué está prohibido.

---

## 1. Matriz de Decisión Operativa

| Skill / Herramienta         | Cuándo Usarla Obligatoriamente                                                                                                                                                                    | Qué está Estrictamente Prohibido                                                                                                                                                                                                   |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ui-ux-modern-taste`**    | • Al crear o editar vistas de PC (`*Desktop.tsx`).<br>• En tablas de alta densidad (`DesktopInventoryGrid`, `HistoryViewDesktop`).<br>• Al refinar scrollbars y nitidez de fuentes en escritorio. | ❌ Prohibido importar componentes táctiles móviles (`ModalSheet`, `CheckoutSheet`).<br>❌ Prohibido glassmorphism pesado o fondos borrosos que resten contraste.<br>❌ Prohibido permitir doble scroll en `window`.                |
| **`image-to-code`**         | • Siempre que el usuario adjunte una captura de pantalla, foto del mostrador o boceto.<br>• Al corregir desalineaciones visuales o columnas apretadas reportadas en imágenes.                     | ❌ Prohibido programar "a ojo" sin descomponer la captura en estructura y tokens.<br>❌ Prohibido inventar diseños genéricos de IA (_cards-inside-cards_ o gradientes morados).                                                    |
| **`playwright-cli` / MCP**  | • **Obligatorio antes de cada commit o merge a `develop`.**<br>• Tras modificar tablas fijas, atajos de teclado o flujos de cobro.                                                                | ❌ Prohibido silenciar tests con `--passWithNoTests`.<br>❌ Prohibido hacer commit si no pasan los 52 tests con código 0 (_Exit 0_).                                                                                               |
| **`web-design-guidelines`** | • Al crear o editar formularios, inputs de texto o selectores de código de barra.<br>• Al auditar navegación por teclado (<kbd>/</kbd>, <kbd>Ctrl+Enter</kbd>, <kbd>Esc</kbd>).                   | ❌ Prohibido `outline-none` sin anillo de foco visible (`focus-visible:ring-2`).<br>❌ Prohibido botones con solo ícono sin `aria-label`.<br>❌ Prohibido `<div onClick>`.                                                         |
| **`quiral-ui-hig`**         | • Al intervenir la interfaz móvil (< 768px) en iPhone Safari / PWA Standalone.<br>• Al implementar modales en `ModalSheet.tsx`.                                                                   | ❌ Prohibido alterar el `TopHeader` fijo (`fixed top-0 w-full z-50 backdrop-blur-md`).<br>❌ Prohibido inyectar `pt-16` o `pb-32`/`pb-44` en vistas.<br>❌ Prohibido sacar botones principales fuera del `footer` de `ModalSheet`. |
| **`quiral-pos-engine`**     | • Al modificar `InventoryContext`, servicios Supabase o lógica de ventas.<br>• En cálculos financieros de costos ponderados, márgenes y arqueos de caja.                                          | ❌ Prohibido ventas duplicadas (exige candado `saleInFlightRef` y deduplicación).<br>❌ Prohibido saldos de stock negativos.<br>❌ Prohibido mutar ventas sin modal de confirmación obligatorio.                                   |
| **`awesome-design-skills`** | • Para inspirarse o extraer tokens de diseño estructurados.<br>• Estilos permitidos: `premium`, `sleek`, `enterprise`, `shadcn`, `bento`.                                                         | ❌ Prohibido aplicar estilos de fantasía o arcade en el mostrador (`pacman`, `sega`, `tetris`, `claymorphism`, `doodle`).                                                                                                          |

---

## 2. Protocolo de Veto Inmediato ante Conflictos

Si un prompt del usuario o una instrucción sugiere una acción que viole esta matriz:

1. **Detención:** El agente debe detenerse antes de modificar archivos protegidos.
2. **Explicación:** Indicar qué regla se violaría (por ejemplo: _"Introducir un modal Bottom Sheet en la vista de escritorio viola la regla de Platform Split"_).
3. **Alternativa Recomendada:** Proponer la solución homologada (por ejemplo: _"En su lugar, añadiremos un panel lateral o diálogo centrado de escritorio"_).
