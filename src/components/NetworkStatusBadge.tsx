import { RefreshCw, WifiOff } from "lucide-react";
import React from "react";
import { useNetworkSync } from "../services/offlineSyncService";

interface NetworkStatusBadgeProps {
  storeId?: string;
  className?: string;
}

/**
 * Indicador reactivo de conectividad y sincronización de cola offline.
 * Se oculta de forma autónoma cuando el sistema está online con cola vacía.
 */
export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  storeId,
  className = "",
}) => {
  const { isOnline, pendingCount, isSyncing, syncNow } =
    useNetworkSync(storeId);

  // Si está conectado y no hay ventas pendientes de sincronizar, no añade ruido visual
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={isOnline && !isSyncing && pendingCount > 0 ? syncNow : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all select-none ${
        !isOnline
          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-xs"
          : isSyncing
            ? "bg-accent/15 text-accent border border-accent/30 animate-pulse"
            : "bg-blue-500/15 text-blue-500 border border-blue-500/30 cursor-pointer hover:bg-blue-500/25"
      } ${className}`}
      title={
        !isOnline
          ? "Sin conexión a internet. Las ventas se guardan localmente en IndexedDB."
          : isSyncing
            ? "Sincronizando ventas acumuladas con Supabase..."
            : "Clic para sincronizar ventas pendientes ahora"
      }
    >
      {!isOnline ? (
        <>
          <WifiOff size={12} className="shrink-0" />
          <span>Modo Offline</span>
          {pendingCount > 0 && (
            <span className="tabular-nums font-black ml-0.5">
              ({pendingCount})
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={12} className="shrink-0 animate-spin" />
          <span>Sincronizando {pendingCount} ventas...</span>
        </>
      ) : (
        <>
          <RefreshCw size={12} className="shrink-0" />
          <span>Sincronizar {pendingCount} pendientes</span>
        </>
      )}
    </div>
  );
};
