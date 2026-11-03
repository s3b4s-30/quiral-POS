# 🖥️ Platform Split y Ergonomía de Escritorio — Quiral POS

> **Ubicación:** `notebook/03_ESTANDARES_DE_DISENO_Y_UI/01_PLATFORM_SPLIT_Y_ERGONOMIA.md`  
> **Ámbito:** Desacoplamiento físico de vistas, estación de trabajo en PC, bloqueo de viewport y navegación tipo Excel.

---

## 1. El Fundamento del Platform Split (`useIsDesktop.ts`)

### El Anti-Patrón Descartado (El Infierno de la Hibridación):

Intentar que un único archivo JSX maneje simultáneamente la experiencia táctil de teléfono (`< 768px`) y la estación de trabajo de PC (`>= 768px`) mediante clases CSS (`hidden md:flex`, `md:hidden`) introduce defectos críticos:

- **Sobrecarga de Memoria:** React monta componentes móviles pesados que nunca se ven en PC, ralentizando la máquina del mostrador.
- **Colisiones de Scroll:** Modales táctiles generan bloqueos de scroll (`overflow: hidden`) sobre la ventana completa.
- **Experiencia Deforme:** En pantallas de 24" aparecían modales angostos con tiradores táctiles para el pulgar sobre fondos negros gigantescos.

### La Solución Arquitectónica Oficial:

- El hook [`useIsDesktop.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/hooks/useIsDesktop.ts) detecta el ancho del viewport en tiempo real (`window.matchMedia('(min-width: 768px)')`).
- El montaje en React es **físicamente excluyente**:
  ```tsx
  export default function PosView(props: PosViewProps) {
    const isDesktop = useIsDesktop();
    return isDesktop ? (
      <PosViewDesktop {...props} />
    ) : (
      <PosViewMobile {...props} />
    );
  }
  ```
- Cuando `isDesktop === true`, el árbol móvil ni siquiera existe en el DOM, garantizando 0ms de interferencia y código 100% puro para PC.

---

## 2. La Lista Negra de Componentes en PC (`*Desktop.tsx`)

En cualquier archivo con sufijo `*Desktop.tsx` o vistas exclusivas de escritorio queda **ESTRICTAMENTE PROHIBIDO**:

- ❌ Importar o renderizar `ModalSheet.tsx` (Bottom Sheet móvil).
- ❌ Importar o renderizar `CheckoutSheet.tsx` (el cobro en PC está permanentemente integrado en el panel lateral `DesktopPosTicket.tsx`).
- ❌ Importar o renderizar `FloatingCartFAB.tsx` o `CartSummaryBar.tsx`.
- ❌ Usar barras de arrastre táctiles (_drag handles_), gestos de _swipe_ o carruseles horizontales cortados sin scrollbar de mouse.

---

## 3. Ergonomía de Pantalla Completa y "Cero Doble-Scroll"

En una estación de trabajo de escritorio, **la ventana del navegador (`window`) jamás debe tener barra de desplazamiento vertical general**:

```tsx
// Estructura Maestra de Vista Desktop
<div className="h-[calc(100vh-var(--quiral-header-offset,4rem))] mt-[var(--quiral-header-offset,4rem)] overflow-hidden flex w-full">
  {/* Panel de Trabajo Scrolleable Independiente */}
  <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
    ...
  </main>
  {/* Panel Lateral Fijo Inmóvil */}
  <aside className="w-96 flex flex-col h-full border-l border-white/5 bg-[var(--bg-secondary)]">
    ...
  </aside>
</div>
```

### Scrollbars Minimalistas Sleek (`.custom-scrollbar`):

Quedan terminantemente prohibidas las barras de desplazamiento toscas grises por defecto del sistema operativo:

```css
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

## 4. Filosofía Keyboard-First (Mouse y Teclado de Mostrador)

1. **Atajos Globales:**
   - <kbd>/</kbd> o <kbd>Ctrl+F</kbd>: Enfocar buscador de catálogo o inventario de inmediato.
   - <kbd>Ctrl+Enter</kbd>: Completar la venta desde cualquier punto de la pantalla.
   - <kbd>Esc</kbd>: Cancelar o cerrar cualquier diálogo modal o vista administrativa.
2. **Navegación Matricial tipo Excel (`DesktopInventoryGrid.tsx`):**
   - Desplazamiento por celdas con flechas del teclado (`↑`, `↓`, `←`, `→`).
   - <kbd>Enter</kbd> edita el stock o precio y baja automáticamente a la siguiente fila.
   - Fila de inserción rápida en serie (`QuickAddRow`) activada con <kbd>Ctrl+N</kbd>.

---

## 5. Nitidez Tipográfica de Mostrador y Ergonomía de Selección

1. **Alta Definición Tipográfica (`.antialiased-hd`):**
   - Directivas forzadas en `body` y tablas: `-webkit-font-smoothing: antialiased;`, `-moz-osx-font-smoothing: grayscale;`, `text-rendering: optimizeLegibility;`.
   - Supresión de aberración cromática: prohibido usar texto coloreado (`text-accent`) sobre fondos de acento sutiles (`bg-accent-subtle`) en temas oscuros, ya que el subpixel rendering genera halos de color difusos. Se emplean contrastes limpios (`text-white` o `text-[var(--text-primary)]`) sobre fondos sólidos con bordes nítidos.
   - Textos de catálogo y celdas escalados a `text-sm font-semibold` o `text-base font-bold` para lectura cómoda a distancia de mostrador.
2. **Iconografía Profesional y Limpieza de Estrellas:**
   - Erradicación de iconos de destellos (`Sparkles` / ✨). Se emplean iconos vectoriales sobrios y semánticos de `lucide-react` (ej. `<Zap size={16} />` para el _Modo Conteo Rápido_).
3. **Ergonomía de Selección:**
   - Clic en el área general vacía de la tarjeta o fila: **selecciona el ítem**.
   - Clic en el enlace/título o botón de acción: **abre el panel de detalle o inspección profunda**, protegido con `e.stopPropagation()` para evitar falsos positivos de selección.
4. **Independencia Cromática de Proveedores:**
   - Los puntos de identificación de proveedores respetan exclusivamente `supplier.color` mediante `style={{ backgroundColor: supplier.color }}`, inmunes a la paleta global `--accent-*`.
