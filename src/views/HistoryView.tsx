import React from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { HistoryViewDesktop, HistoryViewMobile } from "../modules/history";

export interface HistoryViewProps {
  onGoToPOS?: () => void;
  onModalStateChange?: (open: boolean) => void;
}

/**
 * Semáforo Arquitectónico "Platform Split" para el Historial de Ventas.
 * Conmuta entre HistoryViewDesktop e HistoryViewMobile según el viewport
 * delegando la renderización al módulo domain-driven `modules/history`.
 */
export default function HistoryView(props: HistoryViewProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <HistoryViewDesktop {...props} /> : <HistoryViewMobile {...props} />;
}
