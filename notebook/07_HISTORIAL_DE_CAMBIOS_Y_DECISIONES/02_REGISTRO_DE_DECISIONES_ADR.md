# Registro de Decisiones de Arquitectura (ADR) — Quiral POS

> **Ubicación:** `notebook/07_HISTORIAL_DE_CAMBIOS_Y_DECISIONES/02_REGISTRO_DE_DECISIONES_ADR.md`  
> **Nivel de Relevancia:** 99% Permanente (Architecture Decision Records)  
> **Objetivo:** Registrar formalmente las decisiones arquitectónicas clave adoptadas en Quiral POS (`quiral-pwa@1.0.1`), su contexto histórico, alternativas evaluadas y consecuencias a largo plazo.

---

## Índice de Decisiones Arquitectónicas (ADRs)

1. [ADR-001: Platform Split Físico con Hook vs Ocultamiento Cosmético CSS](#adr-001-platform-split-físico-con-hook-vs-ocultamiento-cosmético-css)
2. [ADR-002: Arquitectura Offline-First Híbrida con Dexie.js y TanStack Query](#adr-002-arquitectura-offline-first-híbrida-con-dexiejs-y-tanstack-query)
3. [ADR-003: Transacción Atómica de Venta e Inventario vía RPC en PostgreSQL](#adr-003-transacción-atómica-de-venta-e-inventario-vía-rpc-en-postgresql)
4. [ADR-004: Sistema de Diseño Dual OLED con Fondo Absoluto #000000](#adr-004-sistema-de-diseño-dual-oled-con-fondo-absoluto-000000)
5. [ADR-005: Directiva de Inmunidad de UI en iOS Safari y PWA Standalone](#adr-005-directiva-de-inmunidad-de-ui-en-ios-safari-y-pwa-standalone)
6. [ADR-006: Estándar Determinista de Calidad 100% Exit 0](#adr-006-estándar-determinista-de-calidad-100-exit-0)
7. [ADR-007: Base de Conocimiento Centralizada en `notebook/` Versionada en Git](#adr-007-base-de-conocimiento-centralizada-en-notebook-versionada-en-git)
8. [ADR-008: Blindaje HTTP de Producción y Hardening de RPC en Supabase](#adr-008-blindaje-http-de-producción-y-hardening-de-rpc-en-supabase)

---

## ADR-001: Platform Split Físico con Hook vs Ocultamiento Cosmético CSS

- **Estado:** Aceptado (Inviolable).
- **Fecha:** 2026-10-15
- **Contexto:**  
  En un sistema POS, la experiencia móvil (< 768px) requiere un enfoque táctil con Bottom Sheets, barras inferiores y elementos grandes para el pulgar. Por el contrario, la estación de escritorio ($\ge 768\text{px}$) requiere alta densidad informativa, atajos de teclado, paneles laterales persistentes y cero modales intrusivos.  
  El uso de clases CSS como `hidden md:flex` provoca que ambos árboles de componentes permanezcan montados en el DOM virtual de React, generando escuchadores de eventos duplicados, colisiones de atajos de teclado y fugas de memoria.
- **Decisión:**  
  Adoptar un **Platform Split Físico** gobernado por el hook [`src/hooks/useIsDesktop.ts`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/hooks/useIsDesktop.ts). Las vistas principales se dividen físicamente en componentes especializados (`PosViewMobile.tsx` vs `PosViewDesktop.tsx`, `HistoryViewMobile.tsx` vs `HistoryViewDesktop.tsx`). Solo una variante se monta y renderiza en el DOM según el ancho de pantalla.
- **Consecuencias:**
  - _Positivas:_ Reducción a la mitad del costo de renderizado, cero colisiones de listeners de teclado y aislamiento total de la experiencia de usuario.
  - _Negativas:_ Ligera duplicación de código en la capa de vista que se mitiga compartiendo hooks y servicios en `src/modules/`.

---

## ADR-002: Arquitectura Offline-First Híbrida con Dexie.js y TanStack Query

- **Estado:** Aceptado.
- **Fecha:** 2026-10-24
- **Contexto:**  
  Los cortes de energía o caídas de conectividad en tiendas físicas en Colombia no pueden interrumpir las ventas de mostrador. Depender exclusivamente de una API REST o GraphQL en la nube deja la caja inoperativa ante microcortes de red.
- **Decisión:**  
  Implementar una arquitectura híbrida donde **IndexedDB** (a través de **Dexie.js**) actúa como almacén de datos primario local, y **TanStack Query** gestiona la sincronización asíncrona hacia Supabase en la nube con `networkMode: 'offlineFirst'`. Las mutaciones sin conexión se encolan en `offline_mutation_queue` y se procesan idempotentemente al recuperar la conexión.
- **Consecuencias:**
  - _Positivas:_ Continuidad operativa del 100% sin internet, latencia de lectura de catálogo inferior a 5 ms (desde memoria local).
  - _Negativas:_ Necesidad de reconciliar posibles conflictos de versión si dos dispositivos modifican el mismo producto simultáneamente mientras están desconectados.

---

## ADR-003: Transacción Atómica de Venta e Inventario vía RPC en PostgreSQL

- **Estado:** Aceptado.
- **Fecha:** 2026-10-18
- **Contexto:**  
  Realizar un cobro requiere dos operaciones de escritura: insertar el registro de la venta en la tabla `sales` y decrementar el stock en la tabla `product_lots`. Si el cliente realiza estas operaciones mediante dos llamadas HTTP separadas desde el frontend, una falla de red en el segundo llamado generaría una venta registrada pero con inventario sin descontar (inconsistencia contable crítica).
- **Decisión:**  
  Encapsular toda la lógica de venta, desglose de ítems, cálculo de subtotales y descuento de lotes dentro de una única función almacenada en PostgreSQL: **RPC `complete_sale`**, ejecutada bajo una transacción serializable ACID en Supabase.
- **Consecuencias:**
  - _Positivas:_ Atomicidad absoluta (o se guarda la venta y se descuenta el stock o no ocurre nada), blindaje contra condiciones de carrera.
  - _Negativas:_ Lógica comercial acoplada a PL/pgSQL que requiere pruebas de migración de base de datos antes de ser alterada.

---

## ADR-004: Sistema de Diseño Dual OLED con Fondo Absoluto #000000

- **Estado:** Aceptado.
- **Fecha:** 2026-10-12
- **Contexto:**  
  Las pantallas de POS operan durante jornadas continuas de 10 a 14 horas en entornos de iluminación variada. Los temas oscuros grises convencionales (#18181b) no aprovechan la eficiencia energética de las pantallas OLED ni ofrecen el contraste necesario para lecturas numéricas rápidas de mostrador.
- **Decisión:**  
  Adoptar un tema Dark OLED con negro absoluto (`#000000`) como fondo maestro, combinado con bordes nítidos de 1px en `zinc-800` (`#27272a`) y acentos de color con significado semántico exclusivo (esmeralda para ganancias/aprobado, carmín para mermas/deudas, ámbar para alertas de stock bajo, violeta para atajos de teclado).
- **Consecuencias:**
  - _Positivas:_ Reducción drástica del cansancio visual en jornadas largas, ahorro de batería en dispositivos móviles y legibilidad instantánea de cifras financieras.
  - _Negativas:_ Requiere disciplina estricta para no introducir grises intermedios no autorizados ni degradados pesados.

---

## ADR-005: Directiva de Inmunidad de UI en iOS Safari y PWA Standalone

- **Estado:** Aceptado (Inviolable).
- **Fecha:** 2026-10-20
- **Contexto:**  
  En WebKit iOS, el viewport dinámico, la barra de navegación retráctil y el Dynamic Island / Notch causan desalineaciones frecuentes cuando los desarrolladores usan márgenes fijos (`pt-16`, `pb-32`, `h-screen`). Las soluciones improvisadas suelen romper el layout en modo PWA instalada o en dispositivos con distintas proporciones de pantalla.
- **Decisión:**  
  Declarar una directiva de inmunidad inviolable: centralizar todos los cálculos de despeje en la variable CSS `--quiral-header-offset` y en la clase `.quiral-scroll-container` en [`src/index.css`](file:///c:/Users/Sebas/Desktop/elytras/quiral-POS/src/index.css). Prohibir terminantemente que cualquier vista o agente inyecte márgenes superiores o inferiores adicionales en el flujo de la aplicación.
- **Consecuencias:**
  - _Positivas:_ Experiencia nativa impecable en iOS Safari y PWA Standalone en cualquier modelo de iPhone sin espacios en blanco ni contenido oculto.
  - _Negativas:_ Requiere supervisión constante en revisiones de código para evitar que asistentes de IA inyecten clases de padding por hábito.

---

## ADR-006: Estándar Determinista de Calidad 100% Exit 0

- **Estado:** Aceptado.
- **Fecha:** 2026-10-22
- **Contexto:**  
  La introducción inadvertida de pequeños errores de tipos (`any`, `@ts-ignore`), advertencias de compilación o fallos en cálculos de cambio monetario causan fallas críticas en los despliegues de producción en Vercel y afectan las cajas de los clientes.
- **Decisión:**  
  Imponer una política de tolerancia cero: ningún commit o despliegue es válido a menos que supere de forma consecutiva y limpia los 4 comandos de la suite de calidad:
  1. `npx tsc --noEmit` (Cero errores de TypeScript).
  2. `npm run test:unit` (100% de pruebas unitarias pasando en Vitest).
  3. `npm run build` (Compilación de producción limpia en Vite).
  4. `npx playwright test` (100% de pruebas E2E pasando en Playwright).
- **Consecuencias:**
  - _Positivas:_ Despliegues automáticos a Vercel con 0% de tasa de fallo por errores de código, confiabilidad contable absoluta.
  - _Negativas:_ Aumento del tiempo de validación local previo a cada commit o push (aproximadamente 30 a 60 segundos).

---

## ADR-007: Base de Conocimiento Centralizada en `notebook/` Versionada en Git

- **Estado:** Aceptado.
- **Fecha:** 2026-11-03
- **Contexto:**  
  La dependencia de la memoria volátil de las ventanas de contexto de los modelos de IA (Gemini, Claude, Antigravity) provocaba que los agentes olvidaran decisiones previas, reintrodujeran errores descartados o propusieran estilos contrarios a la filosofía de Quiral POS. La documentación dispersa en carpetas ocultas o fragmentadas dificultaba la sincronización entre cuadernos de investigación y entornos de codificación.
- **Decisión:**  
  Crear un directorio permanente y autosuficiente llamado `notebook/`, estructurado en 7 ejes temáticos, redactado en español de alta densidad y versionado permanentemente en Git en las ramas `develop` y `main`. Este directorio opera como la **Única Fuente de Verdad Invariable al 99%** para cualquier inteligencia artificial o desarrollador humano.
- **Consecuencias:**
  - _Positivas:_ Cualquier modelo o agente puede leer `notebook/` y comprender al instante el 100% de la arquitectura, estándares y restricciones sin necesidad de entrenamiento previo. Reducción a cero de las alucinaciones arquitectónicas.
  - _Negativas:_ Requiere el compromiso activo de actualizar los archivos correspondientes en `notebook/` cuando se adopte un cambio mayor en el sistema.

---

## ADR-008: Blindaje HTTP de Producción y Hardening de RPC en Supabase

- **Estado:** Aceptado.
- **Fecha:** 2026-11-03
- **Contexto:**  
  La exposición de un frontend en producción sin cabeceras de seguridad estrictas deja abierta la puerta a ataques de intermediario (MitM), clickjacking, inyección de scripts externos (XSS) y filtración de referencias sensibles. Asimismo, la presencia de funciones PostgreSQL con privilegios `SECURITY DEFINER` en el esquema `public` de Supabase permite que actores no autenticados invoquen procedimientos internos a través del endpoint REST.
- **Decisión:**
  1. Configurar en `vercel.json` cabeceras de seguridad estrictas en todas las rutas (`/(.*)`):
     - `Content-Security-Policy`: Restringida exclusivamente a orígenes autorizados (Supabase API/WSS, Google Analytics, Clarity, fonts).
     - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (HSTS de 2 años).
     - `X-Frame-Options`: `DENY` (Protección contra clickjacking).
     - `X-Content-Type-Options`: `nosniff` (Protección contra MIME sniffing).
     - `Referrer-Policy`: `strict-origin-when-cross-origin`.
     - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), payment=(), usb=()`.
  2. Endurecer el esquema de base de datos en Supabase revocando permisos `EXECUTE` al rol `anon` en funciones internas (`handle_new_user`, `seed_demo_store`, `update_my_credentials`) y manteniendo `complete_sale` bajo contexto de invocador (`SECURITY INVOKER`) con bloqueo pesimista.
- **Consecuencias:**
  - _Positivas:_ Calificación A+ en escaneos de seguridad de cabeceras, mitigación completa de ataques IDOR y protección contra invocaciones de API no autorizadas.
  - _Negativas:_ Cualquier nuevo dominio externo o servicio de terceros (ej. pasarelas de pago futuras) debe ser declarado explícitamente en el CSP de `vercel.json`.
