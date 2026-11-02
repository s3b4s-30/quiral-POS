import React, { useEffect, useRef, useState } from "react";
import { PackageOpen } from "lucide-react";
import lottie from "lottie-web/build/player/lottie_light";
import { type AnimationItem } from "lottie-web";
import emptyBoxJson from "../assets/empty-box.json";

export interface LottiePlayerProps {
  /** Objeto de animación en formato JSON Lottie */
  animationData?: Record<string, unknown>;
  /** Ruta o URL al archivo .json de la animación */
  path?: string;
  /** Si la animación debe reproducirse en bucle */
  loop?: boolean;
  /** Si debe iniciar automáticamente al montarse */
  autoplay?: boolean;
  /** Velocidad de reproducción (1 = 100%) */
  speed?: number;
  /** Clases CSS de Tailwind para el contenedor */
  className?: string;
  /** Estilos inline adicionales */
  style?: React.CSSProperties;
  /** Callback al finalizar cada ciclo de animación */
  onComplete?: () => void;
  /** Elemento visual alternativo si no se carga animación */
  fallback?: React.ReactNode;
}

/**
 * Ícono de respaldo a prueba de fallos (Apple HIG Empty Box)
 * Garantiza que jamás se renderice un bloque en blanco si Lottie falla o no dispone de datos.
 */
function DefaultFallbackIcon() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[#007aff]/20 bg-[#007aff]/10 text-[#007aff] dark:border-[#0a84ff]/25 dark:bg-[#0a84ff]/15 dark:text-[#0a84ff] shadow-sm">
        <PackageOpen size={40} strokeWidth={1.75} className="animate-pulse" />
      </div>
    </div>
  );
}

/**
 * LottiePlayer — Componente de infraestructura para microinteracciones y estados vacíos
 *
 * Características de rendimiento y diseño Apple HIG:
 * 1. Renderizado vectorial en SVG a 60 FPS sin saturar el hilo principal de React.
 * 2. Destrucción determinística de la instancia al desmontar para prevenir fugas de memoria en WebKit iOS.
 * 3. Aceleración por hardware mediante composición de capas GPU (transform: translateZ(0)).
 * 4. Fallback vectorial automático a prueba de fallos: nunca renderiza un contenedor vacío/blanco.
 */
export default function LottiePlayer({
  animationData,
  path,
  loop = true,
  autoplay = true,
  speed = 1,
  className = "w-32 h-32 mx-auto",
  style,
  onComplete,
  fallback,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animItemRef = useRef<AnimationItem | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    if (!animationData && !path) {
      setHasFailed(true);
      return;
    }

    setHasFailed(false);
    setIsReady(false);
    host.innerHTML = "";

    try {
      const clonedData = animationData
        ? (JSON.parse(JSON.stringify(animationData)) as Record<string, unknown>)
        : undefined;

      const anim = lottie.loadAnimation({
        container: host,
        renderer: "svg",
        loop,
        autoplay,
        animationData: clonedData,
        path,
        rendererSettings: {
          progressiveLoad: false,
          hideOnTransparent: true,
          preserveAspectRatio: "xMidYMid meet",
        },
      });

      anim.setSpeed(speed);
      animItemRef.current = anim;

      const verifySvgMounted = () => {
        const svgEl = host.querySelector("svg");
        if (!svgEl || svgEl.innerHTML.includes("NaN") || svgEl.childElementCount === 0) {
          setHasFailed(true);
        } else {
          svgEl.style.width = "100%";
          svgEl.style.height = "100%";
          svgEl.style.display = "block";
          setIsReady(true);
        }
      };

      // Con animationData en memoria, DOMLoaded ocurre sincrónicamente
      verifySvgMounted();
      anim.addEventListener("DOMLoaded", verifySvgMounted);
      anim.addEventListener("data_failed", () => setHasFailed(true));
      anim.addEventListener("error", () => setHasFailed(true));

      if (onComplete) {
        anim.addEventListener("complete", onComplete);
      }

      return () => {
        anim.removeEventListener("DOMLoaded", verifySvgMounted);
        if (onComplete) {
          anim.removeEventListener("complete", onComplete);
        }
        anim.destroy();
        animItemRef.current = null;
      };
    } catch (err) {
      console.warn("No se pudo inicializar la animación Lottie, activando fallback:", err);
      setHasFailed(true);
    }
  }, [animationData, path, loop, autoplay, speed, onComplete]);

  const showFallback = hasFailed || (!animationData && !path);

  if (showFallback) {
    return (
      <div className={`select-none pointer-events-none flex items-center justify-center ${className}`} style={style}>
        {fallback ?? <DefaultFallbackIcon />}
      </div>
    );
  }

  return (
    <div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        willChange: "transform",
        ...style,
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <DefaultFallbackIcon />}
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

/**
 * Animación Lottie para estados vacíos (Catálogo sin resultados y Carrito vacío)
 */
export const EMPTY_BOX_ANIMATION: Record<string, unknown> =
  emptyBoxJson as Record<string, unknown>;

/**
 * Animación Lottie minimalista integrada (Vector Pulse Checkmark)
 * para confirmaciones de venta o microinteracciones instantáneas sin depender de archivos de red externos.
 */
export const SUCCESS_BURST_ANIMATION: Record<string, unknown> = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "SuccessPulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [100, 100, 100] },
            { t: 30, s: [100, 100, 100], e: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "el",
          d: 1,
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [120, 120] },
        },
        {
          ty: "fl",
          c: { a: 0, k: [0, 0.478, 1, 1] },
          o: { a: 0, k: 100 },
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};
