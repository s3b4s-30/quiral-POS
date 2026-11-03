---
name: ui-ux-modern-taste
description: >-
  Estándares de diseño de alta gama e interfaces SaaS modernas (Linear/Vercel inspired), ergonomía
  desktop de alta densidad, nitidez tipográfica en pantallas grandes y gobernanza de tokens Dual OLED
  para Quiral POS. Úsalo al maquetar o refinar vistas de escritorio, paneles laterales, tickets de venta,
  tablas con densidad de datos, tipografías anti-aliased y scrollbars ultra-delgados sin comprometer el
  Platform Split ni la directiva de inmunidad móvil iOS.
---

# UI/UX Modern Taste & High-Density Desktop Skill

Esta Skill guía a los agentes y desarrolladores en la creación, refinamiento y auditoría de interfaces de usuario modernas, pulidas y de alto rendimiento inspiradas en el estándar visual de **Linear, Vercel y Raycast**, optimizadas para la operativa real de mostrador de **Quiral POS (`quiral-pwa@1.0.1`)**.

---

## 0. 🛡️ Directiva de Convivencia y Platform Split

> [!CAUTION]
> **REGLA DE ORO DE PLATAFORMA:**
> La aplicación de acabados SaaS de alta densidad en escritorio (`>= 768px`) **JAMÁS** debe romper o alterar la experiencia móvil de iOS Safari (`< 768px`):
>
> 1. Toda mejora visual para PC debe aplicarse exclusivamente en componentes con sufijo `*Desktop.tsx` o selectores protegidos por `useIsDesktop.ts`.
> 2. Queda terminantemente prohibido importar componentes móviles táctiles (`ModalSheet`, `CheckoutSheet`, `CartSummaryBar`, `FloatingCartFAB`) en archivos de escritorio.
> 3. En móvil, el `TopHeader` y `.quiral-scroll-container` conservan su inmunidad total de safe-areas.

---

## 1. Principios de Diseño Modern Taste (Linear / Vercel Aesthetic)

### A. Paleta Dual OLED y Jerarquía de Contraste Profundo

- **Fondos Oscuros Puros:** Base profunda `#000000` / `#050505` (`var(--bg-primary)`), paneles secundarios en `#0d0d0d` a `#121212` (`var(--bg-secondary)` / `var(--bg-card)`).
- **Bordes de Precisión de 1px:** Delimitación sutil con `border border-white/5` o `border-white/10` (modo oscuro) y `border-black/5` (modo claro), evitando bordes toscos o sombras desproporcionadas.
- **Tokens de Acento Dinámico:** Integración estricta de las variables de acento activas (`--accent-primary`, `--accent-hover`, `--accent-subtle`, `.shadow-accent-glow`, `.bg-gradient-accent`). Los estados activos o seleccionados aplican un sutil resplandor o badge translúcido `bg-[var(--accent-subtle)] text-[var(--accent-primary)]`.

### B. Tipografía de Alta Nitidez de Mostrador (Sharp & Punchy)

- **Suavizado de Fuente Obligatorio:** Aplicar `antialiased subpixel-antialiased` para evitar fuentes borrosas o delgadas en monitores de PC.
- **Pesos Robustos para Lectura a Distancia:** Evitar pesos ultradelgados (`font-light` / `font-thin`). Los textos de producto, ticket y auditoría deben usar `font-medium`, `font-semibold` o `font-bold` con colores de alto contraste (`text-white` para títulos, `text-neutral-400` para metadatos).
- **Numérica Tabular Obligatoria:** Todas las cantidades, precios en COP, porcentajes de descuento y códigos SKU deben llevar la clase `.tabular-nums` (`font-variant-numeric: tabular-nums; font-mono sm:font-sans`).

### C. Scrollbars Personalizados Sleek (Adiós al Scrollbar Nativo Grueso)

- Prohibido el uso de barras de desplazamiento toscas grises del sistema operativo.
- Todo contenedor desplazable de escritorio (`#inventory-scroll`, `#history-scroll`, panel de ticket) debe emplear la clase `.custom-scrollbar` o estilos webkit minimalistas:
  ```css
  /* Barra ultra-delgada y minimalista */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.24);
  }
  ```

---

## 2. Ergonomía Desktop de Pantalla Completa y Cero Doble-Scroll

### A. Layout Fluido al 100% de Ancho

- Eliminar restricciones artificiales de ancho máximo (`max-w-4xl`, `max-w-5xl` centrados) en estaciones de trabajo POS (`PosViewDesktop.tsx`).
- Las tres columnas o paneles (Catálogo, Filtros y Ticket de Venta) deben expandirse fluidamente para ocupar el 100% del viewport horizontal sin franjas muertas laterales.

### B. Bloqueo de Viewport y Contención de Scroll

```tsx
// Contenedor Maestro de Vista Desktop
<div className="h-[calc(100vh-var(--quiral-header-offset,4rem))] mt-[var(--quiral-header-offset,4rem)] overflow-hidden flex w-full">
  {/* Panel Principal */}
  <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
    ...
  </main>
  {/* Panel Lateral Fijo */}
  <aside className="w-96 flex flex-col h-full border-l border-white/5 bg-[var(--bg-secondary)]">
    ...
  </aside>
</div>
```

- `window` jamás tiene scroll vertical global en escritorio. Los scrolls son independientes y confinados por panel.

---

## 3. Tablas de Auditoría y Grillas de Alta Densidad

Al renderizar datos densos (`DesktopInventoryGrid.tsx`, `HistoryViewDesktop.tsx`):

1. **Columnas de Ancho Seguro (`table-fixed`):**
   - Ticket / ID: `w-20 sm:w-24`
   - Fecha / Hora: `w-36 sm:w-40`
   - Cliente / Detalle: `min-w-[200px]` con `truncate` seguro
   - Método / Estado: `w-28 sm:w-32`
   - Total / Monto COP: `w-32 sm:w-36 text-right pr-4 tabular-nums`
   - Acciones: `w-48 sm:w-52 text-right pr-3`
2. **Cero Carruseles Cortados en PC:** Desplegar garantías, productos o desglose en grillas multi-columna visibles (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`).
3. **Interacción de Teclado Fluida:** Navegación matricial con flechas (`↑`, `↓`, `←`, `→`), edición directa con <kbd>Enter</kbd> y salida limpia con <kbd>Esc</kbd>.

---

## 4. Checklist de Verificación Modern Taste

Antes de completar cualquier refactorización o cambio visual en escritorio:

- [ ] ¿La interfaz aprovecha el 100% del viewport sin márgenes muertos gigantes?
- [ ] ¿Las cifras monetarias usan `.tabular-nums` y pesos tipográficos claros (`font-semibold` o `font-bold`)?
- [ ] ¿Los scrolls son ultra-delgados (`.custom-scrollbar`) y están contenidos dentro de sus paneles sin doble scroll en `window`?
- [ ] ¿Se respetó el Platform Split evitando cualquier importación de `ModalSheet` o `CheckoutSheet` en PC?
- [ ] ¿La paleta respeta los tokens Dual OLED y variables `--accent-*`?
- [ ] ¿El build (`npm run build`) y TypeScript (`npx tsc --noEmit`) compilan con 100% Exit 0?
