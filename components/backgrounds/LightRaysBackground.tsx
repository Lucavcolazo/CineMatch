"use client";

import dynamic from "next/dynamic";

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
 */
export function LightRaysBackground() {
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
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>
    </div>
  );
}
