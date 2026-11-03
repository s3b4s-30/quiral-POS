import React from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { PosViewDesktop, PosViewMobile } from "../modules/pos";

export interface PosViewProps {
  onCheckoutStateChange: (open: boolean) => void;
}

/**
 * Semáforo Arquitectónico "Platform Split" para el Punto de Venta (POS).
 * Monta condicionalmente PosViewDesktop o PosViewMobile según el viewport
 * delegando la renderización al módulo domain-driven `modules/pos`.
 */
export default function PosView(props: PosViewProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <PosViewDesktop {...props} /> : <PosViewMobile {...props} />;
}
