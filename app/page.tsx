import { LightRaysBackground } from "@/components/backgrounds/LightRaysBackground";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col pt-[180px] px-6 pb-6 text-white relative bg-transparent font-[var(--font-space-grotesk)]">
      {/* Fondo: negro + LightRays (efecto proyector desde arriba) */}
      <LightRaysBackground />
      {/* Hero con efecto glass iluminado por el haz del proyector */}
      <section className="flex-1 flex flex-col items-center justify-center max-w-[1400px] w-full mx-auto px-6 z-[2] text-center animate-welcome-enter">
        <div className="px-8 py-6 bg-black/[0.06] backdrop-blur-[6px] border border-white/[0.04] rounded-2xl">
          <h1 className="text-[clamp(36px,8vw,72px)] font-bold tracking-tight leading-tight text-white m-0 text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] drop-shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            Bienvenido a CineMatch
          </h1>
          <p className="text-[clamp(16px,2.5vw,22px)] font-normal text-white/95 mt-1 m-0 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
            las mejores recomendaciones
          </p>
        </div>
      </section>
      <footer className="mt-auto pt-2 pb-6 z-[2] text-center">
        <p className="text-white/60 text-xs m-0">
          vivecodeado por Lucky7
        </p>
      </footer>
    </main>
  );
}
