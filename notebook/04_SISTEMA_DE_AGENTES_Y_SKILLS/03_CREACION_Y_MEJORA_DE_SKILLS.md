# 🛠️ Creación, Auditoría y Mejora de Skills — Quiral POS

> **Ubicación:** `notebook/04_SISTEMA_DE_AGENTES_Y_SKILLS/03_CREACION_Y_MEJORA_DE_SKILLS.md`  
> **Ámbito:** Guía para añadir nuevas habilidades, actualizar existentes y mantener el índice sincronizado.

---

## 1. Estructura Estándar de una Skill en Quiral POS

Toda habilidad debe alojarse en su propio subdirectorio dentro de `.agents/skills/<nombre-skill>/` y contener como mínimo un archivo [`SKILL.md`](./) con encabezado YAML obligatorio:

```yaml
---
name: nombre-de-la-skill
description: >-
  Descripción concisa en tercera persona del propósito de la habilidad,
  sus casos de uso exactos y las tecnologías involucradas.
---
# Título de la Habilidad

## 1. Misión y Propósito
...
## 2. Directivas Técnicas y Reglas de Negocio
...
## 3. Comandos de Ejecución y Flujo de Trabajo
...
## 4. Adaptación a Quiral POS (Reglas Obligatorias del Proyecto)
- Subordinación a la Inmunidad de UI móvil iOS
- Cumplimiento de Platform Split
- Paleta Dual OLED y números con .tabular-nums y formatCOP()
```

---

## 2. Flujo para Instalar Habilidades Upstream (Repositorios Oficiales)

Para incorporar habilidades de la comunidad o creadores oficiales (como Vercel, tasteskill o bergside):

1. **Uso del CLI Oficial de Skills:**
   ```bash
   npx skills add <repositorio-github> --skill <nombre-de-la-skill> -y --copy
   ```
   _Nota:_ Usar siempre `--copy` para evitar problemas de enlaces simbólicos en Windows.
2. **Adición de la Sección de Adaptación:**
   - Mantener el cuerpo original del autor.
   - Añadir al final la sección `## ADAPTATION TO QUIRAL POS (PROJECT OVERRIDES)` vinculando las reglas del proyecto (Platform Split, Dual OLED, formatCOP, Exit 0).
3. **Registro en la Documentación:**
   - Registrar la skill en [`.agents/SKILLS_INDEX.md`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/.agents/SKILLS_INDEX.md).
   - Registrarla en [`AGENTS.md`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/AGENTS.md).
   - Actualizar [`docs/AGENTS_AND_SKILLS_MANIFESTO.md`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/docs/AGENTS_AND_SKILLS_MANIFESTO.md).

---

## 3. Protocolo de Auditoría y Verificación de Skills

Antes de autorizar una nueva skill en el repositorio:

1. **Verificación de Seguridad:** Asegurarse de que la skill no ejecute scripts que intenten leer credenciales o variables de entorno sensibles (`.env`).
2. **Validación de Compilación y Calidad:**
   ```bash
   npx tsc --noEmit
   npm run test:unit
   npm run build
   npx playwright test
   ```
3. Los cuatro comandos deben finalizar con código de salida `0` (_Exit 0_).
