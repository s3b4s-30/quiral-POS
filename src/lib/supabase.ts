import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://demo.quiral.xyz";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key";

/** Umbral en milisegundos para registrar advertencias de consultas pesadas */
export const SLOW_QUERY_THRESHOLD_MS = 800;

/** Tamaño de página predeterminado para cargas paginadas de inventario e historial */
export const SUPABASE_PAGE_SIZE = 250;

export interface DbTelemetryEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  operation: string;
  durationMs?: number;
  storeId?: string;
  details?: string;
}

const MAX_TELEMETRY_BUFFER = 50;
const telemetryBuffer: DbTelemetryEntry[] = [];

/**
 * Registra eventos estructurados de base de datos y red sin bloquear la UI.
 */
export function logDbEvent(
  level: DbTelemetryEntry["level"],
  operation: string,
  meta?: { durationMs?: number; storeId?: string; details?: string }
): void {
  const entry: DbTelemetryEntry = {
    timestamp: new Date().toISOString(),
    level,
    operation,
    durationMs: meta?.durationMs,
    storeId: meta?.storeId,
    details: meta?.details,
  };

  telemetryBuffer.push(entry);
  if (telemetryBuffer.length > MAX_TELEMETRY_BUFFER) {
    telemetryBuffer.shift();
  }

  if (level === "error") {
    console.error(
      `[QuiralDB][ERROR] op=${operation}${meta?.durationMs !== undefined ? ` (${meta.durationMs}ms)` : ""}${meta?.details ? ` :: ${meta.details}` : ""}`
    );
  } else if (level === "warn") {
    console.warn(
      `[QuiralDB][WARN] op=${operation}${meta?.durationMs !== undefined ? ` (${meta.durationMs}ms)` : ""}${meta?.details ? ` :: ${meta.details}` : ""}`
    );
  }
}

export function getRecentDbLogs(): readonly DbTelemetryEntry[] {
  return telemetryBuffer;
}

/**
 * Ejecuta una consulta o mutación de Supabase midiendo latencia y capturando cuellos de botella.
 */
export async function withDbTelemetry<T>(
  operation: string,
  storeId: string | undefined,
  fn: () => PromiseLike<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      logDbEvent("warn", operation, {
        durationMs,
        storeId,
        details: `Consulta lenta detectada (>${SLOW_QUERY_THRESHOLD_MS}ms)`,
      });
    } else {
      logDbEvent("info", operation, { durationMs, storeId });
    }
    return result;
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const details = err instanceof Error ? err.message : String(err);
    logDbEvent("error", operation, { durationMs, storeId, details });
    throw err;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-application-name": "quiral-pos-pwa",
    },
  },
});
