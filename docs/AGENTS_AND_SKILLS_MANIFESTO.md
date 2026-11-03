# 🧭 Manifiesto de Gobierno de Agentes y Skills — Quiral POS

> **Versión:** 1.0.1  
> **Propósito:** Guía de referencia rápida y mapa de ruta único en **Lenguaje Humano Claro** para desarrolladores, asistentes de IA (Antigravity, Claude Code, Cursor, Codex) y nuevos cuadernos de trabajo.  
> **Regla de Oro:** Ningún agente o desarrollador debe escribir una sola línea de código sin antes consultar este manifiesto para saber qué herramienta activar, qué reglas de diseño aplicar y qué patrones están terminantemente prohibidos.

---

## 🎯 1. Principios Inquebrantables del Sistema (Para Todo Agente)

Antes de seleccionar una habilidad, grábate estas tres directivas cardinales:

1. **Platform Split Inviolable (División Física Móvil vs PC):**
   - Móvil (`< 768px`) y Escritorio (`>= 768px`) están físicamente separados con `useIsDesktop.ts`.
   - **En PC está PROHIBIDO** abrir modales emergentes angostos de teléfono (`ModalSheet`, `CheckoutSheet`), carruseles horizontales cortados o botones flotantes (`FloatingCartFAB`). El cobro en PC vive en el panel lateral fijo (`DesktopPosTicket`).
2. **Inmunidad Móvil iOS (Safe Areas y Edge-to-Edge):**
   - **PROHIBIDO** tocar el `TopHeader` (`fixed top-0 w-full z-50 backdrop-blur-md pt-[env(safe-area-inset-top)]`).
   - **PROHIBIDO** meter `pt-16`, `pb-32`, `pb-44` o `mb-20` en los contenedores de scroll.
3. **Ergonomía de Mostrador y 60 FPS:**
   - Todos los precios en pesos colombianos (COP) y cantidades llevan la clase CSS `.tabular-nums` y se formatean con `formatCOP()`.
   - Cero doble scroll en ventanas de escritorio: el `window` jamás tiene barra de desplazamiento; los paneles interiores scrollean con `.custom-scrollbar`.

---

## 🛠️ 2. Matriz de Gobierno: Qué Usar, Cuándo y Qué Está Prohibido

### 1. Agente de Diseño y Estética de Escritorio (`ui-ux-modern-taste` / `corporate`)

- **Encargado de:** Construir y optimizar la estación de trabajo de PC (`>= 768px`), la grilla de inventario tipo Excel (`DesktopInventoryGrid`), la tabla de auditoría del historial (`HistoryViewDesktop`) y el panel lateral de venta rápida.
- **Cuándo usarlo obligatoriamente:**
  - Al editar o crear componentes de escritorio (`*Desktop.tsx`).
  - Al diseñar tablas de datos masivos, filtros rápidos, paneles de métricas o vistas administrativas a pantalla completa (`DesktopSuppliersView`, `DesktopStoreProfileView`).
  - Cuando se requiera mejorar la nitidez de fuentes (`subpixel-antialiased`) para lectura ágil a un metro de distancia en el mostrador.
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido el glassmorphism pesado:** Nada de fondos excesivamente desenfocados, brillos deslumbrantes o transparencias que resten nitidez a números, códigos SKU o precios.
  - ❌ **Prohibido el neobrutalism o estilos caóticos:** Nada de sombras sólidas caricaturescas de 4px, rotaciones o bordes negros gruesos en zonas de trabajo continuo.
  - ❌ **Prohibido importar modales móviles:** Jamás importar `ModalSheet`, `CheckoutSheet`, `CartSummaryBar` o `FloatingCartFAB` en archivos de escritorio.

---

### 2. Agente de Traducción Visual de Capturas (`image-to-code`)

- **Encargado de:** Analizar imágenes, capturas de pantalla de fallos visuales o bocetos de diseño, extrayendo su estructura para traducirla de forma fiel a componentes React 18 limpios con Tailwind CSS.
- **Cuándo usarlo obligatoriamente:**
  - Cuando el usuario proporcione una captura de pantalla (ej. `image_e908e2.jpg`, capturas de mostrador o mockups de Figma/Stitch).
  - Al corregir desalineaciones visuales, saltos de texto o columnas apretadas reportadas mediante imágenes.
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido programar "a ojo" sin descomponer la imagen:** No se debe improvisar código sin antes identificar el contenedor padre, la grilla, las tipografías y los contrastes reales.
  - ❌ **Prohibido reinterpretar con estilos genéricos de IA:** No transformar una tabla sobria en un mosaico de tarjetas redondeadas adentro de tarjetas con gradientes morados (_AI slop_).
  - ❌ **Prohibido mezclar plataformas:** Si la imagen es de un celular, el código va a `*Mobile.tsx`. Si es de monitor horizontal, va a `*Desktop.tsx`.

---

### 3. Agente de Calidad y Pruebas Automatizadas E2E (`playwright-cli` / `@playwright/mcp`)

- **Encargado de:** Ejecutar, depurar y validar de forma 100% autónoma la suite completa de 52 pruebas de integración y regresión visual en navegadores reales (`chromium` y `Mobile Safari iPhone 14 Standalone`).
- **Cuándo usarlo obligatoriamente:**
  - **Obligatorio antes de cada commit o pull request:** Ninguna tarea se da por terminada si `npx playwright test` no arroja **52 passed** con código de salida `0` (_Exit 0_).
  - Al modificar tablas de auditoría, atajos de teclado de mostrador, navegación matricial tipo Excel o flujos de autenticación.
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido ignorar fallos con `--passWithNoTests` o silenciar aserciones:** Cada prueba debe verificar selectores reales del DOM.
  - ❌ **Prohibido hacer commits con errores pendientes:** Si un selector falla o una celda se comprime a 0px, se debe reparar el layout de inmediato.

---

### 4. Agente de Pautas Web, Accesibilidad y Rendimiento (`web-design-guidelines`)

- **Encargado de:** Auditar el código HTML, estados de foco de teclado, accesibilidad ARIA, etiquetas semánticas y rendimiento de renderizado según los estándares de Vercel.
- **Cuándo usarlo obligatoriamente:**
  - Al crear o modificar formularios, inputs numéricos, lectores de código de barra o modales.
  - Al revisar navegación exclusiva por teclado (<kbd>/</kbd>, <kbd>Ctrl+Enter</kbd>, <kbd>Esc</kbd>, flechas arriba/abajo).
  - En auditorías preventivas de despliegue en Vercel (`quiral.xyz`).
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido usar `outline-none` sin reemplazo:** Todo botón o input interactivo debe lucir un anillo de foco visible (`focus-visible:ring-2`).
  - ❌ **Prohibido botones sin etiqueta:** Íconos solos sin texto deben incluir siempre `aria-label`.
  - ❌ **Prohibido elementos `<div onClick>`:** Usar siempre etiquetas semánticas nativas (`<button>`, `<a>`, `<input>`).

---

### 5. Agente de UI Móvil y Estándares Apple HIG (`quiral-ui-hig`)

- **Encargado de:** Garantizar que la experiencia táctil en iPhone Safari / PWA Standalone funcione con la fluidez y elegancia nativa de iOS.
- **Cuándo usarlo obligatoriamente:**
  - Al tocar pantallas móviles (`PosViewMobile.tsx`, `HistoryViewMobile.tsx`, `InventoryView.tsx`).
  - Al crear o ajustar formularios dentro de `ModalSheet.tsx`.
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido mover los botones principales fuera del pie del modal:** Todo botón de acción («Guardar», «Cobrar», «Listo») debe vivir en el `footer` de `ModalSheet` anclado a la zona segura inferior.
  - ❌ **Prohibido dejar visible la barra inferior (`Navbar`) con un modal abierto:** La barra debe desmontarse limpiamente con `!hasActiveModal`.
  - ❌ **Prohibido alterar los paddings globales:** Respetar los cálculos automáticos de `.quiral-scroll-container`.

---

### 6. Agente de Motor POS, Inventario y Datos (`quiral-pos-engine`)

- **Encargado de:** Proteger las transacciones comerciales, la sincronización con Supabase (PostgreSQL), la arquitectura Offline-First con Dexie.js (IndexedDB) y la distribución determinista de lotes.
- **Cuándo usarlo obligatoriamente:**
  - Al modificar `InventoryContext.tsx`, `offlineSyncService.ts` o consultas a Supabase.
  - Al procesar ventas, devoluciones, cierres de ciclo o ajustes de inventario.
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido permitir ventas duplicadas:** Toda venta exige candado sincrónico en vuelo (`saleInFlightRef`) y deduplicación por `id` y `saleNumber`.
  - ❌ **Prohibido eliminar o modificar ventas sin confirmación:** `deleteSale` y `updateSale` exigen diálogo modal obligatorio y restitución exacta del stock a sus lotes de origen.
  - ❌ **Prohibido saldos de stock negativos:** Si no hay existencias, la venta o el ajuste no puede proceder.

---

### 7. Catálogo de Sistemas de Diseño Estilísticos (`awesome-design-skills`)

- **Encargado de:** Proveer referencias formales y fichas técnicas (`DESIGN.md` + `SKILL.md`) de 67 sistemas de diseño oficiales (del ecosistema `typeui.sh`).
- **Cuándo usarlo obligatoriamente:**
  - Cuando se requiera inspiración o tokens calibrados para un nuevo módulo o rediseño.
  - Estilos preferidos para Quiral POS: **`premium`** (para toques Apple en móvil), **`sleek`** / **`enterprise`** (para escritorio denso), **`bento`** (para métricas y resúmenes) y **`shadcn`** (para componentes utilitarios).
- **Qué está estrictamente prohibido usar:**
  - ❌ **Prohibido aplicar estilos de fantasía, cómic o arcade en el mostrador:** Quedan vetados estilos como `pacman`, `sega`, `tetris`, `doodle` o `claymorphism` en pantallas operativas de venta o inventario.

---

## 🚦 3. Protocolo de Decisión y Búsqueda Permanente (Checklist Pre-Código)

Antes de emitir cualquier propuesta o modificar código, el agente debe responder mentalmente este checklist:

```
┌────────────────────────────────────────────────────────────────────────┐
│               CHECKLIST DE VERIFICACIÓN PREVIA (EXIT 0)                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. ¿Esta tarea afecta móvil (< 768px), escritorio (>= 768px) o ambos? │
│    ↳ Si es escritorio: ¿Se respetó el Platform Split sin modales táctiles?
│    ↳ Si es móvil: ¿Se protegió el TopHeader y los márgenes safe-area?  │
│ 2. ¿Las cifras monetarias usan formatCOP() y .tabular-nums?           │
│ 3. ¿El scroll es local con .custom-scrollbar sin doble scroll en PC?   │
│ 4. ¿Se ejecutó la suite completa de calidad con 100% Exit 0?           │
│    ↳ npx tsc --noEmit                                                  │
│    ↳ npm run test:unit                                                 │
│    ↳ npm run build                                                     │
│    ↳ npx playwright test                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 4. Formato de Exportación Humana (Para Nuevos Chats o Cuadernos)

Si necesitas iniciar una nueva conversación con una IA o transferir este contexto a un cuaderno de trabajo, copia y pega el siguiente bloque:

```text
ESTÁS TRABAJANDO EN: Quiral POS (quiral-pwa@1.0.1).
REGLAS OBLIGATORIAS:
1. Platform Split: Móvil (< 768px) y Desktop (>= 768px) están físicamente separados (useIsDesktop). Cero modales móviles o carruseles en PC; el ticket vive fijo a la derecha.
2. Inmunidad Móvil: No tocar TopHeader ni inyectar paddings redundantes (pt-16, pb-32).
3. Estética: Mostrador tipo Linear/Vercel (Dual OLED: #000000 base, bordes de 1px, acentos dinámicos). Prohibido glassmorphism pesado o neobrutalism.
4. Datos y Formateo: Números con .tabular-nums y formatCOP(). Sin ventas duplicadas (saleInFlightRef).
5. Calidad: Toda entrega debe pasar con 100% Exit 0 (tsc, unit tests, build, 52 pruebas de Playwright).
```
