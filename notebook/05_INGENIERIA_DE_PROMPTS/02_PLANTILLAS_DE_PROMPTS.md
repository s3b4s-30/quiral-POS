# 📋 Plantillas Maestras de Prompts para Antigravity — Quiral POS

> **Ubicación:** `notebook/05_INGENIERIA_DE_PROMPTS/02_PLANTILLAS_DE_PROMPTS.md`  
> **Ámbito:** Modelos de prompts listos para copiar, personalizar y ejecutar según la naturaleza de la tarea.

---

## 🖥️ Plantilla 1: Intervención en Estación de Trabajo Desktop (`>= 768px`)

```markdown
Rol: Arquitecto Frontend Senior, Especialista en Ergonomía Desktop de Alta Densidad (Quiral POS v1.0.1).

Contexto y Gobernanza:

- Rama: develop.
- Plataforma objetivo: Escritorio (>= 768px).
- Skills activas: `ui-ux-modern-taste` y `quiral-pos-engine`.
- Documentos de consulta obligatoria: `notebook/03_ESTANDARES_DE_DISENO_Y_UI/01_PLATFORM_SPLIT_Y_ERGONOMIA.md` y `docs/DESKTOP_UI_RULES.md`.

Objetivo de la Tarea:
[Describir la mejora exacta, por ejemplo: Agregar un filtro rápido por proveedor en la cabecera de DesktopInventoryGrid].

Restricciones Innegociables:

1. Respetar el Platform Split: PROHIBIDO importar ModalSheet o CheckoutSheet. Usar diálogos centrados o paneles laterales.
2. Contención de viewport: El window jamás debe tener scroll general; scroll local con .custom-scrollbar.
3. Precios y cantidades: Usar clase .tabular-nums y formateador formatCOP().
4. Mantener atajos de teclado y 60 FPS sin re-renders innecesarios.

Validación Obligatoria (100% Exit 0):

- npx tsc --noEmit
- npm run test:unit
- npm run build
- npx playwright test
- git commit con mensaje semántico y git push origin develop.
```

---

## 📱 Plantilla 2: Intervención en Experiencia Móvil iOS (`< 768px`)

```markdown
Rol: Especialista en Interfaces Táctiles Móviles y Estándares Apple HIG (Quiral POS v1.0.1).

Contexto y Gobernanza:

- Rama: develop.
- Plataforma objetivo: Móvil táctil (< 768px, iPhone Safari / PWA Standalone).
- Skills activas: `quiral-ui-hig` y `impeccable`.
- Documentos de consulta obligatoria: `notebook/03_ESTANDARES_DE_DISENO_Y_UI/02_APPLE_HIG_E_INMUNIDAD_MOVIL.md` y `DESIGN_GUIDELINES.md`.

Objetivo de la Tarea:
[Describir la tarea, por ejemplo: Ajustar la selección de lotes dentro de PosProductCard para mejorar el tap target en pantallas pequeñas].

Restricciones Innegociables:

1. Inmunidad de UI: PROHIBIDO alterar TopHeader (fixed top-0) o inyectar pt-16, pb-32 o pb-44 en .quiral-scroll-container.
2. Botones de acción principal: Si se utiliza un modal, el botón debe vivir en el slot `footer` de ModalSheet anclado a safe-area.
3. Desmontaje de Navbar: Asegurar que body.modal-open oculte la barra de navegación.
4. Estados vacíos: Utilizar LottiePlayer con EMPTY_BOX_ANIMATION y fallback vectorial.

Validación Obligatoria (100% Exit 0):

- npx tsc --noEmit
- npm run test:unit
- npm run build
- npx playwright test --project="Mobile Safari iPhone 14 Standalone"
- git commit y git push origin develop.
```

---

## 💾 Plantilla 3: Modificación de Inventario, Transacciones o Supabase

```markdown
Rol: Ingeniero de Datos y Backend Frontend, Especialista en PostgreSQL, RLS y Dexie.js (Quiral POS v1.0.1).

Contexto y Gobernanza:

- Rama: develop.
- Skills activas: `quiral-pos-engine` y `security-audit`.
- Documentos de consulta obligatoria: `notebook/02_ARQUITECTURA_Y_SISTEMA/03_DATOS_SUPABASE_Y_OFFLINE.md` y `QUIRAL_V1.0.1_DOCS.md`.

Objetivo de la Tarea:
[Describir la tarea, por ejemplo: Agregar cálculo de margen de ganancia porcentual en la creación de nuevos lotes en InventoryContext].

Restricciones Innegociables:

1. Multi-Tenant seguro: Todas las consultas y mutaciones deben aislarse estrictamente por store_id.
2. Prevención de ventas duplicadas: Mantener candado sincrónico saleInFlightRef y deduplicación por id.
3. Consistencia de lotes: El stock total de un producto debe ser siempre la suma exacta de sus lotes (lots). Prohibidos saldos negativos.
4. Offline-First: Si la mutación afecta ventas o catálogo, asegurar respaldo en Dexie.js (salesQueue/cachedProducts).

Validación Obligatoria (100% Exit 0):

- npx tsc --noEmit
- npm run test:unit (validar que los 53 tests pasen limpios)
- npm run build
- git commit y git push origin develop.
```

---

## 🖼️ Plantilla 4: Traducción Visual de Capturas a Código (Image to Code)

```markdown
Rol: Diseñador UI/UX y Desarrollador Frontend Senior de Visión a Código (Quiral POS v1.0.1).

Contexto y Gobernanza:

- Archivo de imagen adjunto: [Ruta o nombre de la captura, ej. image_e908e2.jpg].
- Skills activas: `image-to-code` y `ui-ux-modern-taste`.
- Documentos de consulta obligatoria: `notebook/04_SISTEMA_DE_AGENTES_Y_SKILLS/02_MATRIZ_DE_USO_Y_PROHIBICIONES.md`.

Objetivo de la Tarea:
Analizar la captura adjunta y traducir con fidelidad milimétrica el diseño a componentes React 18 limpios con Tailwind CSS.

Restricciones Innegociables:

1. Descomponer primero: Identificar estructura de contenedores, ejes Flex/Grid y tokens antes de codificar.
2. Determinar plataforma: Si la captura es horizontal de PC, va a *Desktop.tsx; si es vertical de teléfono, a *Mobile.tsx.
3. Paleta Dual OLED: Fondo negro #000000 puro, bordes 1px border-white/5, acentos corporativos dinámicos.
4. Formateo: Números con .tabular-nums y formatCOP(). Cero estilos inline innecesarios.

Validación Obligatoria (100% Exit 0):

- npx tsc --noEmit && npm run test:unit && npm run build && npx playwright test
- git commit y git push origin develop.
```
