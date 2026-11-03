# 🔄 Protocolo de Respuesta y Retroalimentación: Antigravity ➔ Notebook

> **Ubicación:** `notebook/05_INGENIERIA_DE_PROMPTS/03_PROTOCOLO_DE_RESPUESTA_A_NOTEBOOK.md`  
> **Ámbito:** Estándar de reporte de ejecución para cerrar el ciclo colaborativo y alimentar a Notebook.

---

## 1. El Estándar de Reporte que Antigravity Debe Entregar

Al finalizar cualquier tarea, Antigravity debe entregar un reporte estructurado y de alta nitidez que contenga exactamente estos 5 puntos:

```markdown
### 🛡️ [Título Claro de la Tarea Completada] (100% Exit 0)

1. RESUMEN EJECUTIVO EN LENGUAJE HUMANO:
   ↳ Qué se hizo, por qué se hizo y qué beneficio aporta al mostrador.

2. ARCHIVOS MODIFICADOS Y CREADOS:
   ↳ Tabla con rutas clickables `file:///` y propósito de cada cambio.

3. RESULTADOS DE LA SUITE DE VERIFICACIÓN OBLIGATORIA:
   ✔ npx tsc --noEmit: 0 errores
   ✔ npm run test:unit: 53/53 tests en verde
   ✔ npm run build: Compilación limpia en Vite
   ✔ npx playwright test: 52/52 tests aprobados

4. CONTROL DE VERSIONES:
   ↳ Hash de commit en develop (ej. `b20134c`) y confirmación de push a origin/develop.

5. PRÓXIMO PASO RECOMENDADO O ALINEACIÓN:
   ↳ Qué tarea continúa en el roadmap o qué decisión técnica requiere input del usuario.
```

---

## 2. Cómo Notebook (la IA Analítica) Procesa este Reporte

Cuando Sebas pegue la respuesta de Antigravity en Notebook (Gemini / Claude / etc.), la IA analítica debe:

1. **Explicar en Palabras Sencillas:** Traducir los cambios técnicos a impacto directo para el negocio (ej. _"Ahora el cajero puede buscar productos con presionar la tecla / sin tener que usar el mouse"_).
2. **Validar Cumplimiento de Reglas:** Verificar que no se hayan violado las restricciones del proyecto (ej. que no se hayan introducido modales móviles en PC o roto los formateadores COP).
3. **Proponer el Siguiente Paso Lógico:** Sugerir el siguiente prompt listo para Antigravity basándose en el roadmap de [`notebook/01_VISION_Y_FILOSOFIA/03_ROADMAP_E_IDEAS_FUTURAS.md`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/notebook/01_VISION_Y_FILOSOFIA/03_ROADMAP_E_IDEAS_FUTURAS.md).
