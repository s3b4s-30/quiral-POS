import React from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import HistoryViewDesktop from "./HistoryViewDesktop";
import HistoryViewMobile from "./HistoryViewMobile";

export interface HistoryViewProps {
  onGoToPOS?: () => void;
  onModalStateChange?: (open: boolean) => void;
}

/**
 * Semáforo Arquitectónico "Platform Split" para el Historial de Ventas.
 * Conmuta entre HistoryViewDesktop e HistoryViewMobile según el viewport
 * garantizando cero modales táctiles en escritorio y cero interferencia en móvil.
 */
export default function HistoryView(props: HistoryViewProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <HistoryViewDesktop {...props} /> : <HistoryViewMobile {...props} />;
}
