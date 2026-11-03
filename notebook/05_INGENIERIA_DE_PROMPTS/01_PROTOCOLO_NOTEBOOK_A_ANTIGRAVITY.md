# 📐 Protocolo de Ingeniería de Prompts: Notebook ➔ Antigravity

> **Ubicación:** `notebook/05_INGENIERIA_DE_PROMPTS/01_PROTOCOLO_NOTEBOOK_A_ANTIGRAVITY.md`  
> **Ámbito:** Guía estratégica para que la IA en Notebook diseñe prompts de máxima efectividad para Antigravity.

---

## 1. La Anatomía del Prompt Perfecto para Antigravity

Antigravity es un agente autónomo de ingeniería de software con acceso completo a terminal, herramientas y edición de archivos. Para que actúe de manera quirúrgica sin romper nada, **el prompt diseñado en Notebook debe contener 5 bloques obligatorios**:

```markdown
1. ROL Y AUTORIDAD TÉCNICA
   ↳ Define el sombrero mental del agente (ej. Arquitecto Frontend Senior, Especialista en Supabase).

2. CONTEXTO OPERATIVO Y HABILIDADES REQUERIDAS
   ↳ Rama git actual (`develop`), viewport objetivo (`Móvil < 768px` o `Desktop >= 768px`).
   ↳ Skills que DEBE activar obligatoriamente (ej. `ui-ux-modern-taste`, `quiral-pos-engine`).
   ↳ Documentos rectores de referencia en `notebook/`.

3. OBJETIVO CONCRETO Y ALCANCE QUIRÚRGICO
   ↳ Qué se debe modificar exactamente, evitando ambigüedades.
   ↳ Qué archivos están involucrados (y cuáles NO deben tocarse).

4. RESTRICCIONES DETERMINISTAS (LINEAS ROJAS)
   ↳ Platform Split (cero modales en PC / botones en footer en móvil).
   ↳ Formateo COP (.tabular-nums y formatCOP).
   ↳ Inmunidad de TopHeader y safe-areas.

5. PROTOCOLO DE CIERRE Y CONTROL DE CALIDAD (100% EXIT 0)
   ↳ npx tsc --noEmit
   ↳ npm run test:unit
   ↳ npm run build
   ↳ npx playwright test
   ↳ git commit con mensaje semántico y push a develop.
```

---

## 2. Errores Comunes que Notebook Debe Evitar al Generar Prompts

1. **Prompts "Pide-Todo" o Demasiado Extensos:**
   - _Error:_ Pedir en un solo prompt rediseñar el inventario, cambiar la base de datos y agregar un módulo de facturación.
   - _Práctica recomendada:_ Dividir el trabajo en tareas atómicas y secuenciales de 1 o 2 archivos por iteración.
2. **Olvidar Especificar la Plataforma (Móvil vs PC):**
   - _Error:_ Decir _"Agrega un botón de cobro en el POS"_. Antigravity podría agregarlo erróneamente en el móvil o en el escritorio.
   - _Práctica recomendada:_ Especificar siempre: _"En la vista de escritorio `DesktopPosTicket.tsx`..."_ o _"En el bottom sheet móvil `CheckoutSheet.tsx`..."_.
3. **No Recordar la Inmunidad de UI:**
   - _Error:_ Pedir _"Corrige el espacio superior de la pantalla agregando margen `pt-16`"_. Esto viola la regla de inmunidad de `TopHeader`.
   - _Práctica recomendada:_ Indicar expresamente: _"Respeta la altura de `TopHeader` y los cálculos de `.quiral-scroll-container` sin inyectar `pt-16` ni `pb-32`"_.
