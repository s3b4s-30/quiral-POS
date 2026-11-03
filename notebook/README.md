# 🧠 Notebook Quiral POS — Base de Conocimiento Centralizada y Permanente

> **Versión:** 1.0.1 (Estable)  
> **Propósito:** Cerebro documental permanente, agnóstico de modelo de IA y fuente central de verdad técnica, funcional y de diseño para **Quiral POS**.  
> **Destinatarios:** Desarrolladores humanos, asistentes de IA en cuadernos de análisis (Gemini, Claude, ChatGPT) y agentes ejecutores de código (Google Antigravity, Cursor, Codex).

---

## 🌟 1. Filosofía del Ecosistema de Trabajo

Este repositorio opera bajo un ciclo colaborativo de tres actores:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE TRABAJO QUIRAL                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │   1. NOTEBOOK       │                 │   2. ANTIGRAVITY       │   │
│   │   (Gemini / Claude) │ ──────────────> │   (Agente Ejecutor)    │   │
│   │                     │  Prompt Maestro │                        │   │
│   │  • Investigación    │  Contextualizado│  • Consulta docs       │   │
│   │  • Exploración      │                 │  • Activa skills       │   │
│   │  • Diseño de prompt │                 │  • Escribe código      │   │
│   │  • Análisis técnico │                 │  • Valida 100% Exit 0  │   │
│   └─────────────────────┘                 └────────────────────────┘   │
│              ▲                                         │               │
│              │          Reporte de Cambios             │               │
│              │        y Estado de Compilación          │               │
│              └─────────────────────────────────────────┘               │
│                                   │                                    │
│                                   ▼                                    │
│                     ┌───────────────────────────┐                      │
│                     │   3. NOTEBOOK REFLECTION  │                      │
│                     │   • Explicación sencilla  │                      │
│                     │   • Verificación de metas │                      │
│                     │   • Preparación sig. paso │                      │
│                     └───────────────────────────┘                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Notebook (La Estrategia):** Se utiliza para explorar ideas, analizar tecnologías, resolver dudas de arquitectura y preparar prompts de alta precisión utilizando el contexto de esta carpeta.
2. **Antigravity (La Ejecución):** Recibe el prompt, lee la documentación relevante, activa las skills necesarias, modifica solo el código estrictamente necesario, ejecuta la suite de pruebas completa y actualiza la documentación.
3. **Notebook nuevamente (La Explicación):** Recibe el reporte de ejecución de Antigravity y explica en lenguaje natural, claro y accesible, qué cambió, cómo funciona y qué sigue.

---

## 🗺️ 2. Índice General de la Base de Conocimiento

Esta base de conocimiento está organizada en 7 módulos temáticos que cubren el 100% de la operativa del proyecto:

### 📁 [01_VISION_Y_FILOSOFIA/](./01_VISION_Y_FILOSOFIA/)

- [`01_IDENTIDAD_Y_PROPOSITO.md`](./01_VISION_Y_FILOSOFIA/01_IDENTIDAD_Y_PROPOSITO.md): Propósito de Quiral POS, propuesta de valor, contexto comercial minorista en Colombia.
- [`02_HISTORIA_Y_ESTADO_ACTUAL.md`](./01_VISION_Y_FILOSOFIA/02_HISTORIA_Y_ESTADO_ACTUAL.md): Cómo nació, evolución histórica, hitos consolidados y estado de la versión 1.0.1.
- [`03_ROADMAP_E_IDEAS_FUTURAS.md`](./01_VISION_Y_FILOSOFIA/03_ROADMAP_E_IDEAS_FUTURAS.md): Próximas fases (Fase 5: Seguridad y RLS), backlog de innovación y funcionalidades planeadas.

### 📁 [02_ARQUITECTURA_Y_SISTEMA/](./02_ARQUITECTURA_Y_SISTEMA/)

- [`01_STACK_TECNOLOGICO.md`](./02_ARQUITECTURA_Y_SISTEMA/01_STACK_TECNOLOGICO.md): React 18, Vite, TypeScript, Tailwind, Supabase, TanStack Query, Dexie.js, Playwright, Vitest.
- [`02_MAPA_DE_DIRECTORIOS_Y_MODULOS.md`](./02_ARQUITECTURA_Y_SISTEMA/02_MAPA_DE_DIRECTORIOS_Y_MODULOS.md): Estructura modular (`modules/pos`, `modules/inventory`, `modules/history`), servicios y contextos.
- [`03_DATOS_SUPABASE_Y_OFFLINE.md`](./02_ARQUITECTURA_Y_SISTEMA/03_DATOS_SUPABASE_Y_OFFLINE.md): Modelado PostgreSQL, políticas RLS multi-tenant, RPC `complete_sale`, arquitectura Offline-First.
- [`04_FLUJOS_Y_CICLOS_DE_VIDA.md`](./02_ARQUITECTURA_Y_SISTEMA/04_FLUJOS_Y_CICLOS_DE_VIDA.md): Ciclos de vida de venta, ajuste de inventario, reposición de lotes, cierre de ciclo y reconciliación offline.

### 📁 [03_ESTANDARES_DE_DISENO_Y_UI/](./03_ESTANDARES_DE_DISENO_Y_UI/)

- [`01_PLATFORM_SPLIT_Y_ERGONOMIA.md`](./03_ESTANDARES_DE_DISENO_Y_UI/01_PLATFORM_SPLIT_Y_ERGONOMIA.md): Desacoplamiento físico PC vs Móvil con `useIsDesktop.ts`, contención de layout y cero doble scroll.
- [`02_APPLE_HIG_E_INMUNIDAD_MOVIL.md`](./03_ESTANDARES_DE_DISENO_Y_UI/02_APPLE_HIG_E_INMUNIDAD_MOVIL.md): Inmunidad de `TopHeader`, safe-areas iOS, `ModalSheet` con footer interactivo y auto-ocultamiento de Navbar.
- [`03_SISTEMA_DUAL_OLED_Y_TOKENS.md`](./03_ESTANDARES_DE_DISENO_Y_UI/03_SISTEMA_DUAL_OLED_Y_TOKENS.md): Paleta Dual OLED pura (`#000000`), bordes sutiles de 1px, variables dinámicas `--accent-*`.
- [`04_TIPOGRAFIA_Y_NUMEROS_COP.md`](./03_ESTANDARES_DE_DISENO_Y_UI/04_TIPOGRAFIA_Y_NUMEROS_COP.md): Numérica tabular `.tabular-nums`, formateo universal con `formatCOP()` y nitidez anti-aliased.

### 📁 [04_SISTEMA_DE_AGENTES_Y_SKILLS/](./04_SISTEMA_DE_AGENTES_Y_SKILLS/)

- [`01_CATALOGO_DE_SKILLS.md`](./04_SISTEMA_DE_AGENTES_Y_SKILLS/01_CATALOGO_DE_SKILLS.md): Inventario completo de las 21 skills y herramientas (Tier 1, Tier 2 y Tier 3).
- [`02_MATRIZ_DE_USO_Y_PROHIBICIONES.md`](./04_SISTEMA_DE_AGENTES_Y_SKILLS/02_MATRIZ_DE_USO_Y_PROHIBICIONES.md): Cuándo activar obligatoriamente cada skill y qué estilos o patrones están terminantemente vetados.
- [`03_CREACION_Y_MEJORA_DE_SKILLS.md`](./04_SISTEMA_DE_AGENTES_Y_SKILLS/03_CREACION_Y_MEJORA_DE_SKILLS.md): Protocolo para auditar, sincronizar y crear nuevas habilidades en `.agents/skills/`.

### 📁 [05_INGENIERIA_DE_PROMPTS/](./05_INGENIERIA_DE_PROMPTS/)

- [`01_PROTOCOLO_NOTEBOOK_A_ANTIGRAVITY.md`](./05_INGENIERIA_DE_PROMPTS/01_PROTOCOLO_NOTEBOOK_A_ANTIGRAVITY.md): Guía de diseño de prompts desde Notebook para maximizar la efectividad en Antigravity.
- [`02_PLANTILLAS_DE_PROMPTS.md`](./05_INGENIERIA_DE_PROMPTS/02_PLANTILLAS_DE_PROMPTS.md): Plantillas listas para copiar y personalizar (tareas de UI Desktop, UI Móvil, Lógica de Datos, E2E, Refactorización).
- [`03_PROTOCOLO_DE_RESPUESTA_A_NOTEBOOK.md`](./05_INGENIERIA_DE_PROMPTS/03_PROTOCOLO_DE_RESPUESTA_A_NOTEBOOK.md): Cómo Antigravity reporta sus resultados y cómo Notebook interpreta y explica el trabajo realizado.

### 📁 [06_REGLAS_RESTRICCIONES_Y_CALIDAD/](./06_REGLAS_RESTRICCIONES_Y_CALIDAD/)

- [`01_ZONAS_SAGRADAS_E_INTOCABLES.md`](./06_REGLAS_RESTRICCIONES_Y_CALIDAD/01_ZONAS_SAGRADAS_E_INTOCABLES.md): Directiva de inmunidad de UI, candado de venta en vuelo, cero claves `service_role` en cliente.
- [`02_ESTANDAR_100_EXIT_0.md`](./06_REGLAS_RESTRICCIONES_Y_CALIDAD/02_ESTANDAR_100_EXIT_0.md): Requisito innegociable de 4 comandos limpios (`tsc`, `test:unit`, `build`, `playwright`).
- [`03_MANEJO_DE_ERRORES_Y_REGRESIONES.md`](./06_REGLAS_RESTRICCIONES_Y_CALIDAD/03_MANEJO_DE_ERRORES_Y_REGRESIONES.md): Catálogo de errores resueltos en el proyecto y soluciones deterministas.

### 📁 [07_HISTORIAL_DE_CAMBIOS_Y_DECISIONES/](./07_HISTORIAL_DE_CAMBIOS_Y_DECISIONES/)

- [`01_HISTORIAL_DE_FASES.md`](./07_HISTORIAL_DE_CAMBIOS_Y_DECISIONES/01_HISTORIAL_DE_FASES.md): Registro histórico de las Fases 1 a 4 y consolidación de skills, con problemas superados y commits.
- [`02_REGISTRO_DE_DECISIONES_ADR.md`](./07_HISTORIAL_DE_CAMBIOS_Y_DECISIONES/02_REGISTRO_DE_DECISIONES_ADR.md): Architectural Decision Records (ADRs) que explican por qué se tomaron las decisiones clave.

---

## ⚡ 3. Reglas de Operación Rápida para cualquier IA

1. **Lectura Previa Obligatoria:** Antes de generar código, lee el módulo correspondiente a la tarea.
2. **Modificación Quirúrgica:** Toca solo los archivos indispensables para cumplir el requerimiento. No hagas refactorizaciones no solicitadas en archivos sanos.
3. **No Suponer, Verificar:** Si no tienes certeza de un tipo o función, consúltalo en `src/types/domain.ts` o en los archivos fuente.
4. **Validación Automática:** Toda intervención debe terminar con la ejecución limpia de la suite de calidad (TypeScript, Vitest, Build, Playwright).
