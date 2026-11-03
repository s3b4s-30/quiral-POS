# 🎯 Identidad y Propósito del Proyecto — Quiral POS

> **Ubicación:** `notebook/01_VISION_Y_FILOSOFIA/01_IDENTIDAD_Y_PROPOSITO.md`  
> **Ámbito:** Filosofía de producto, propuesta de valor y visión operativa.

---

## 1. ¿Qué es Quiral POS?

**Quiral POS** (`quiral-pwa@1.0.1`) es una aplicación web progresiva (PWA) de punto de venta, control de inventario multi-lote y administración de mostrador diseñada para comercios minoristas, tiendas físicas y negocios de tecnología en Colombia.

El nombre **Quiral** proviene del concepto físico y biológico de _quiralidad_ (elementos idénticos que no se pueden superponer, como las manos izquierda y derecha). En el software, este principio fundamenta la arquitectura **Platform Split**: una única verdad de datos y lógica compartida, pero dos experiencias de usuario completamente especializadas y desacopladas (una para la mano del cajero en iPhone/móvil y otra para la estación de trabajo fija en pantalla grande con mouse y teclado).

---

## 2. El Problema que Resuelve en el Mostrador Real

En el comercio minorista tradicional y en tiendas físicas de tecnología (accesorios, cargadores, repuestos, electrónica):

1. **Pérdida de Ventas por Caída de Conexión:** Los sistemas POS basados 100% en la nube se bloquean cuando la red móvil o el Wi-Fi del local falla. Quiral resuelve esto con arquitectura **Offline-First** (Dexie.js + IndexedDB), permitiendo cobrar sin interrupción y sincronizar automáticamente al volver la red.
2. **Caos en Costos y Garantías Multi-Lote:** Un mismo producto (ej. "Cubo de Carga 20W") se compra en diferentes fechas a diferentes precios a distintos proveedores. La mayoría de los POS promedian el costo de forma errática o pierden la fecha de garantía del lote. Quiral gestiona existencias por **lotes individuales** con costo unitario, fecha de vencimiento/garantía y cálculo ponderado en tiempo real.
3. **Fatiga Visual y Lentitud de Interfaz:** Interfaces con fuentes borrosas, modales emergentes lentos o botones desproporcionados ralentizan la atención al cliente. Quiral implementa una interfaz inspirada en **Linear y Vercel** con modo Dual OLED puro (`#000000`), fuentes antialiased nítidas y atajos de teclado tipo Excel.

---

## 3. Propuesta de Valor Diferencial

- **Dual Platform Split:** En móvil (< 768px), una experiencia táctil que emula una aplicación nativa de iOS (Apple HIG, gestos en `ModalSheet`, safe-areas exactas). En PC (>= 768px), una estación de trabajo de alta densidad a pantalla completa con navegación matricial rápida por flechas de teclado.
- **Transacciones Atómicas Deterministas:** La venta no es un simple descuento de números en memoria; es una transacción atómica ejecutada en PostgreSQL mediante el RPC `complete_sale` en Supabase, con deduplicación por candado sincronizado (`saleInFlightRef`).
- **Soberanía Multi-Tenant:** Cada tienda física opera de forma hermética mediante aislamiento por `store_id` validado por políticas de seguridad a nivel de fila (RLS).
- **Experiencia de 60 FPS:** Cero renders innecesarios, virtualización de listas grandes (`@tanstack/react-virtual`) y componentes atómicos memorizados (`React.memo`).
