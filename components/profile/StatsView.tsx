"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import MagicBento from "@/components/ui/MagicBento";
import { Footer } from "@/components/Footer";

export type StatsViewProps = {
  watchedMovies: number;
  watchedSeries: number;
  topGenres: { name: string; count: number }[];
  topProviders: { name: string; count: number }[];
  movieMinutes: number;
};

function useCountUp(end: number, durationMs = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || end === 0) {
      setValue(end);
      return;
    }
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (startTime == null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, durationMs, enabled]);
  return value;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m} min` : `${h}h`;
}

export function StatsView({
  watchedMovies,
  watchedSeries,
  topGenres,
  topProviders,
  movieMinutes,
}: StatsViewProps) {
  const countMovies = useCountUp(watchedMovies);
  const countSeries = useCountUp(watchedSeries);
  const countMinutes = useCountUp(movieMinutes);

  const maxGenre = Math.max(...topGenres.map((g) => g.count), 1);
  const maxProvider = Math.max(...topProviders.map((p) => p.count), 1);

  return (
    <div className="min-h-screen bg-black text-white pt-[110px] lg:pt-[57px]">
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al perfil
        </Link>
        <h1 className="text-2xl font-bold text-white mb-8">Estadísticas</h1>

        <MagicBento
          textAutoHide
          enableSpotlight
          enableBorderGlow
          enableTilt={false}
          enableMagnetism={false}
          spotlightRadius={400}
          glowColor="255, 255, 255"
          disableAnimations={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <section
              className={cn(
                "magic-bento-card magic-bento-card--border-glow border border-white/10 rounded-2xl p-6 bg-zinc-900/50 animate-stats-enter relative"
              )}
              style={{ animationDelay: "0ms" }}
            >
            <h2 className="text-lg font-semibold text-white mb-2">Vistas en general</h2>
            <div className="flex flex-wrap gap-6 mt-2">
              <div>
                <p className="text-white/60 text-sm">Películas</p>
                <p className="text-2xl font-bold text-white tabular-nums">{countMovies}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Series</p>
                <p className="text-2xl font-bold text-white tabular-nums">{countSeries}</p>
              </div>
            </div>
            </section>

            <section
              className={cn(
                "magic-bento-card magic-bento-card--border-glow border border-white/10 rounded-2xl p-6 bg-zinc-900/50 animate-stats-enter relative"
              )}
              style={{ animationDelay: "100ms" }}
            >
            <h2 className="text-lg font-semibold text-white mb-2">Tiempo en películas</h2>
            <p className="text-3xl font-bold text-white tabular-nums">
              {formatMinutes(countMinutes)}
            </p>
            <p className="text-white/60 text-sm mt-1">duración total de películas vistas</p>
            </section>
          </div>

          <section
            className={cn(
              "magic-bento-card magic-bento-card--border-glow border border-white/10 rounded-2xl p-6 bg-zinc-900/50 mb-6 animate-stats-enter relative"
            )}
            style={{ animationDelay: "200ms" }}
          >
          <h2 className="text-lg font-semibold text-white mb-4">Tu género favorito</h2>
          {topGenres.length === 0 ? (
            <p className="text-white/50 text-sm">Aún no hay datos. Marcá películas o series como vistas.</p>
          ) : (
            <ul className="space-y-4">
              {topGenres.map((g, i) => (
                <li key={g.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-white/60 text-xs font-medium truncate">{g.name}</span>
                    <span className="text-white/40 text-xs tabular-nums shrink-0">{g.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="stats-bar-in h-full rounded-full bg-white/90 min-w-[2px]"
                      style={{
                        width: `${(g.count / maxGenre) * 100}%`,
                        animationDelay: `${250 + i * 80}ms`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          </section>

          <section
            className={cn(
              "magic-bento-card magic-bento-card--border-glow border border-white/10 rounded-2xl p-6 bg-zinc-900/50 animate-stats-enter relative"
            )}
            style={{ animationDelay: "300ms" }}
          >
          <h2 className="text-lg font-semibold text-white mb-4">Plataformas en tus vistas</h2>
          <p className="text-white/50 text-xs mb-4">
            Ten en cuanta que las peliculas pueden estar en multiples plataformas.
          </p>
          {topProviders.length === 0 ? (
            <p className="text-white/50 text-sm">Aún no hay datos de plataformas.</p>
          ) : (
            <ul className="space-y-4">
              {topProviders.map((p, i) => (
                <li key={p.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-white/60 text-xs font-medium truncate">{p.name}</span>
                    <span className="text-white/40 text-xs tabular-nums shrink-0">{p.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="stats-bar-in h-full rounded-full bg-white/90 min-w-[2px]"
                      style={{
                        width: `${(p.count / maxProvider) * 100}%`,
                        animationDelay: `${350 + i * 80}ms`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          </section>
        </MagicBento>
        <Footer />
      </div>
    </div>
  );
}
