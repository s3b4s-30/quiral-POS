import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente centralizado de TanStack Query para Quiral POS.
 * Aplica políticas optimizadas para mostradores de comercio:
 * - staleTime (5 min): Evita solicitudes repetitivas durante transacciones continuas.
 * - gcTime (30 min): Mantiene datos en memoria ante cambios frecuentes de pestaña.
 * - retry: 2 reintentos si la red está disponible; se detiene inmediatamente si está offline.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: (failureCount, _error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

/**
 * Fábrica de llaves tipadas para consultas de catálogo y estado servidor.
 */
export const queryKeys = {
  catalog: (storeId: string) => ["catalog", storeId] as const,
  suppliers: (storeId: string) => ["suppliers", storeId] as const,
  sales: (storeId: string) => ["sales", storeId] as const,
  closures: (storeId: string) => ["closures", storeId] as const,
  storeProfile: (storeId: string) => ["storeProfile", storeId] as const,
};
