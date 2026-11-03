# 🚀 Roadmap y Visión Futura del Proyecto — Quiral POS

> **Ubicación:** `notebook/01_VISION_Y_FILOSOFIA/03_ROADMAP_E_IDEAS_FUTURAS.md`  
> **Ámbito:** Planificación estratégica, próximas fases de ingeniería y backlog de ideas.

---

## 1. Etapa Inmediata: Fase 5 (Auditoría, RLS y Seguridad DAST/SAST)

La siguiente fase técnica programada para el proyecto tiene como objetivo blindar la capa de datos y verificar la seguridad multi-tenant antes del despliegue masivo:

1. **Auditoría Exhaustiva de Políticas RLS en Supabase:**
   - Verificar que cada una de las 9 tablas (`stores`, `store_members`, `suppliers`, `products`, `sales`, `cycle_closings`, `categories`, `attribute_bank`, `catalog_configs`) impida cualquier fuga de información entre diferentes tiendas mediante `store_id = current_setting('app.current_store_id')` o función auxiliar `is_store_member(store_id)`.
   - Simular ataques de inyección de ID de tienda para comprobar que un usuario no pueda leer ni mutar ventas ajenas.
2. **Auditoría SAST y DAST de Dependencias:**
   - Auditoría automatizada de vulnerabilidades con `security-audit` skill y `npm audit`.
   - Detección de posibles fugas de tokens o referencias inseguras en Client Components.
3. **Control de Concurrencia en Inventario:**
   - Pruebas de estrés concurrentes sobre el RPC `complete_sale` en Postgres para confirmar que dos ventas simultáneas del último artículo en stock no generen saldos negativos bajo ninguna circunstancia.

---

## 2. Backlog de Funcionalidades a Corto Plazo

- **🖨️ Impresión Térmica de Recibos (ESC/POS):**
  - Soporte directo para impresoras térmicas de 58mm y 80mm mediante **Web Bluetooth API** (móvil) y **WebUSB / Web Serial API** (escritorio).
  - Generación de tickets limpios con tipografía monoespaciada sin depender del cuadro de diálogo nativo de impresión del sistema operativo.
- **📦 Modo Lector de Código de Barras Físico:**
  - Soporte nativo para escáneres USB en modo _Keyboard Wedge_ (captura rápida del buffer de teclas y adición instantánea al carrito sin requerir enfocar el campo de búsqueda).
- **🔄 Selector y Cambio Rápido de Tienda (Multi-Store):**
  - Para usuarios con múltiples sucursales, permitir cambiar de tienda en un clic sin cerrar sesión, actualizando reactivamente los catálogos en memoria y el contexto de Dexie.js.

---

## 3. Visión a Mediano y Largo Plazo

- **📊 Dashboard de Analítica Comercial Predictiva:**
  - Análisis de rotación de inventario: productos de mayor margen vs productos de baja salida.
  - Alertas predictivas de abastecimiento: cálculo de días de inventario restante según la velocidad promedio de venta de las últimas 2 semanas.
- **🤝 Fidelización y CRM Ligero de Clientes:**
  - Registro ágil de clientes por número de cédula o teléfono desde el ticket lateral.
  - Historial de compras por cliente y registro de garantías vigentes vinculadas al número de serie o IMEI del producto.
- **🌐 Sincronización Local P2P en Red Local (Local First):**
  - Si se corta el internet pero hay red local Wi-Fi, permitir que dos dispositivos dentro de la misma tienda (ej. un teléfono y una PC) sincronicen ventas entre sí antes de subir a la nube.
