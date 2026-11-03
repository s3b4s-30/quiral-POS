import React from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import PosViewDesktop from "./PosViewDesktop";
import PosViewMobile from "./PosViewMobile";

export interface PosViewProps {
  onCheckoutStateChange: (open: boolean) => void;
}

/**
 * Semáforo Arquitectónico "Platform Split" para el Punto de Venta (POS).
 * Monta condicionalmente PosViewDesktop o PosViewMobile según el viewport
 * sin mezclar árboles DOM ni retener componentes móviles en escritorio.
 */
export default function PosView(props: PosViewProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <PosViewDesktop {...props} /> : <PosViewMobile {...props} />;
}
