"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

type LightRaysProps = {
  raysOrigin?: "top-center" | "top-left" | "top-right" | "right" | "left" | "bottom-center" | "bottom-right" | "bottom-left";
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
};

const LightRays = dynamic<LightRaysProps>(
  () => import("./LightRays").then((m) => m.default),
  { ssr: false }
);

/**
 * Fondo para la landing: negro + LightRays con efecto de proyector.
 * Los rayos salen desde arriba (top-center) e iluminan el título como un proyector de cine.
 * En móvil se usan parámetros ajustados para que el efecto se vea bien (más largo y algo más ancho).
 */
export function LightRaysBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 min-h-screen max-h-[100dvh] h-screen bg-black pointer-events-none"
      aria-hidden
    >
      <div className="absolute inset-0 w-full h-full min-h-full max-h-[100dvh]">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={isMobile ? 0.65 : 0.5}
          rayLength={isMobile ? 4.5 : 3}
          followMouse={!isMobile}
          mouseInfluence={isMobile ? 0 : 0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={isMobile ? 1.2 : 1}
          saturation={isMobile ? 1.15 : 1}
        />
      </div>
    </div>
  );
}
