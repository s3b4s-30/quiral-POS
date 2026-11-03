# 🛠️ Stack Tecnológico y Decisiones de Ingeniería — Quiral POS

> **Ubicación:** `notebook/02_ARQUITECTURA_Y_SISTEMA/01_STACK_TECNOLOGICO.md`  
> **Ámbito:** Lenguajes, frameworks, librerías y justificación de selección técnica.

---

## 1. El Stack Central de Producción

| Capa / Rol                  | Tecnología / Paquete | Versión    | Justificación Técnica en el Proyecto                                                                                                  |
| :-------------------------- | :------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework Base**          | **React**            | `^18.3.1`  | Manejo declarativo del DOM, hooks concurrentes y ecosistema maduro para interfaces de mostrador.                                      |
| **Empaquetador & Servidor** | **Vite**             | `^6.0.5`   | Compilación ultra-rápida (HMR instantáneo en desarrollo y empaquetado de producción en < 4 segundos con Rollup).                      |
| **Lenguaje**                | **TypeScript**       | `^5.7.2`   | Tipado estricto en modo estricto. Cero escapes con `any` o `@ts-ignore`. Todos los tipos de dominio residen en `src/types/domain.ts`. |
| **Motor de Estilos**        | **Tailwind CSS**     | `^3.4.16`  | Clases utilitarias directas, paletas Dual OLED con variables CSS dinámicas y cero sobrecarga de CSS en tiempo de ejecución.           |
| **Caché y Estado Servidor** | **TanStack Query**   | `^5.105.3` | Sincronización asíncrona inteligente en segundo plano, `staleTime` de 5 min y prevención de consultas redundantes sin red.            |
| **Virtualización de DOM**   | **TanStack Virtual** | `^3.14.25` | Renderizado eficiente de miles de registros en tablas desktop sin degradar FPS mediante el hook `useScrollParentVirtualizer`.         |
| **Almacenamiento Offline**  | **Dexie.js**         | `^4.4.7`   | Wrapper reactivo sobre IndexedDB que gestiona la cola de ventas offline y la copia local del catálogo.                                |
| **Base de Datos & Auth**    | **Supabase JS**      | `^2.118.0` | Cliente oficial de Supabase para PostgreSQL, transacciones atómicas RPC y suscripciones en tiempo real.                               |
| **Iconografía Oficial**     | **Lucide React**     | `^0.468.0` | Iconos vectoriales limpios y consistentes, con trazo calibrado de 1.5 a 2.0.                                                          |
| **Animaciones Lottie**      | **Lottie Web**       | `^5.13.0`  | Renderizado de estados vacíos con `EMPTY_BOX_ANIMATION` y fallback vectorial garantizado.                                             |

---

## 2. Herramientas de Desarrollo, Automatización y QA

| Herramienta                 | Rol / Propósito            | Justificación                                                                                               |
| :-------------------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Vitest** (`^5.1.0`)       | Suite de Pruebas Unitarias | Ejecución instantánea en memoria compatible con Vite, con 53 tests pasando en < 2 segundos.                 |
| **JSDOM** (`^30.1.3`)       | Emulación de DOM en Node   | Permite probar el ciclo de vida de componentes React y navegación de teclado sin abrir un navegador.        |
| **Playwright** (`^1.64.1`)  | Suite de Pruebas E2E       | Validación en navegadores reales: Desktop Chrome y emulación estricta de Safari iOS (iPhone 14 Standalone). |
| **Husky** (`^9.1.7`)        | Ganchos de Git Pre-Commit  | Bloquea commits si `tsc --noEmit` o `lint-staged` fallan, previniendo regresiones en `develop`.             |
| **Lint-staged** (`^17.6.0`) | Linter sobre Staged Files  | Formatea selectivamente archivos modificados con Prettier sin colapsar por límites de comando de Windows.   |
| **Prettier** (`^3.9.10`)    | Formateador Determinista   | Mantiene consistencia de sangrías, comillas y saltos de línea en todo el equipo.                            |

---

## 3. Decisiones Técnicas Clave (¿Por qué no otras opciones?)

1. **¿Por qué Dexie.js en vez de `localStorage` para Offline?**
   - `localStorage` es síncrono, bloquea el hilo principal de JavaScript y tiene un límite estricto de ~5MB.
   - Dexie.js opera sobre **IndexedDB**, es 100% asíncrono, soporta transacciones estructuradas, índices de búsqueda y almacena cientos de megabytes sin ralentizar la interfaz.
2. **¿Por qué Platform Split con `useIsDesktop.ts` en vez de clases CSS `hidden md:block`?**
   - El ocultamiento cosmético con CSS mantiene montados en memoria los componentes móviles pesados en PC (y viceversa), causando fugas de memoria, colisiones de scroll (`overflow: hidden`) y modales que se abren de forma invisible.
   - Con `useIsDesktop.ts`, React desmonta por completo el árbol móvil en PC, logrando código 100% puro para la estación de trabajo.
3. **¿Por qué RPC `complete_sale` en Postgres en vez de mutaciones individuales en cliente?**
   - Una venta involucra insertar la cabecera, insertar las líneas de detalle, descontar el stock de múltiples lotes y registrar el kardex. Si la red cae a mitad del proceso, mutaciones individuales dejarían la base de datos corrupta.
   - El RPC ejecuta todo dentro de una **transacción atómica en el servidor**: o todo se guarda con éxito, o se revierte automáticamente sin alterar el stock.
