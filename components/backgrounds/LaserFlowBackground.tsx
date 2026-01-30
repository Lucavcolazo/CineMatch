"use client";

import dynamic from "next/dynamic";

// Carga LaserFlow solo en cliente (usa Three.js / WebGL)
const LaserFlow = dynamic(
  () => import("./LaserFlow").then((m) => m.LaserFlow),
  { ssr: false }
);

/**
 * Fondo para la landing: negro + Laser Flow de React Bits.
 * Se usa en la página principal para que el láser quede detrás del contenido.
 */
export function LaserFlowBackground() {
  return (
    <div
      className="fixed inset-0 z-0 min-h-screen max-h-[100dvh] h-screen bg-black pointer-events-none"
      aria-hidden
    >
      <div className="absolute inset-0 w-full h-full min-h-full max-h-[100dvh]">
        <LaserFlow
          horizontalBeamOffset={0.1}
          verticalBeamOffset={-0.55}
          color="#FFFFFF"
          horizontalSizing={0.5}
          verticalSizing={4}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.5}
          fogScale={0.35}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
        />
      </div>
    </div>
  );
}
