"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import type { MediaType } from "@/lib/tmdb";
import { getWatchedStatus, toggleWatched } from "@/lib/actions/user";

type WatchProvider = { provider_id: number; provider_name: string };

type TmdbTitleDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  watch_providers?: {
    flatrate: WatchProvider[];
    rent: WatchProvider[];
    buy: WatchProvider[];
  };
};

type Props = {
  mediaType: MediaType;
  id: number;
  onClose: () => void;
  region?: string;
};

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

export function TitleModal({ mediaType, id, onClose, region = "AR" }: Props) {
  const [data, setData] = useState<TmdbTitleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchedLoading, setWatchedLoading] = useState(false);

  // Cargar estado "La vi" al abrir el modal
  useEffect(() => {
    if (!id || !mediaType) return;
    getWatchedStatus({ tmdbId: id, mediaType }).then(setIsWatched);
  }, [id, mediaType]);

  useEffect(() => {
    const type = mediaType === "movie" || mediaType === "tv" ? mediaType : "movie";
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `/api/title/${type}/${id}?region=${encodeURIComponent(region)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar");
        return res.json();
      })
      .then((d) => {
        if (!cancelled) {
          if (d && typeof d === "object" && "error" in d) {
            setError(String((d as { error: string }).error));
          } else {
            setData(d as TmdbTitleDetails);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType, id, region]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const title = data?.title ?? data?.name ?? "Sin título";
  const typeLabel = mediaType === "movie" ? "Película" : "Serie";
  const duration = data?.runtime
    ? `${data.runtime} min`
    : data?.episode_run_time?.length
      ? `${data.episode_run_time[0]} min/ep`
      : null;
  const year = data?.release_date?.slice(0, 4) ?? data?.first_air_date?.slice(0, 4) ?? null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {loading && (
          <div className="flex items-center justify-center min-h-[300px] text-white/70">
            Cargando...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-400">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 p-6">
              {/* Póster 160×240 px, mismo tamaño que en grillas */}
              {data.poster_path ? (
                <img
                  src={`${POSTER_BASE}${data.poster_path}`}
                  alt={title}
                  className="w-40 h-60 flex-shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <h2 id="modal-title" className="text-2xl font-bold text-white mb-1">
                  {title}
                </h2>
              <p className="text-white/70 text-sm mb-4">
                {typeLabel}
                {year ? ` · ${year}` : ""}
                {duration ? ` · ${duration}` : ""}
              </p>

              {/* Botón "La vi": relleno cuando está marcado, solo borde cuando no. Actualización optimista al hacer clic. */}
              <div className="mb-4">
                <button
                  type="button"
                  disabled={watchedLoading}
                  onClick={async () => {
                    setWatchedLoading(true);
                    const next = !isWatched;
                    setIsWatched(next);
                    await toggleWatched({ tmdbId: id, mediaType });
                    const actual = await getWatchedStatus({ tmdbId: id, mediaType });
                    setIsWatched(actual);
                    setWatchedLoading(false);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    isWatched
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "border-white/30 bg-transparent text-white hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 ${
                      isWatched ? "border-white bg-white/20" : "border-white/60"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} className={isWatched ? "text-white" : "text-white/50"} />
                  </span>
                  {isWatched ? "La vi" : "Marcar como vista"}
                </button>
              </div>

              {data.vote_average != null && (
                <p className="text-white/80 text-sm mb-4">
                  Puntuación TMDB: {Number(data.vote_average).toFixed(1)}/10
                </p>
              )}

              {data.genres?.length ? (
                <p className="text-white/80 text-sm mb-4">
                  Géneros: {data.genres.map((g) => g.name).join(", ")}
                </p>
              ) : null}

              {/* Dónde ver: plataformas o en cines */}
              {(data.watch_providers?.flatrate?.length || data.watch_providers?.rent?.length || data.watch_providers?.buy?.length) ? (
                <div className="text-white/80 text-sm mb-4 space-y-1">
                  {data.watch_providers.flatrate?.length ? (
                    <p>
                      <span className="text-white/60">Streaming:</span> {data.watch_providers.flatrate.map((p) => p.provider_name).join(", ")}
                    </p>
                  ) : null}
                  {data.watch_providers.rent?.length ? (
                    <p>
                      <span className="text-white/60">Alquiler:</span> {data.watch_providers.rent.map((p) => p.provider_name).join(", ")}
                    </p>
                  ) : null}
                  {data.watch_providers.buy?.length ? (
                    <p>
                      <span className="text-white/60">Compra:</span> {data.watch_providers.buy.map((p) => p.provider_name).join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {(() => {
                const releaseStr = data.release_date ?? data.first_air_date;
                if (!releaseStr) return null;
                const release = new Date(releaseStr);
                const now = new Date();
                const daysSince = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24);
                const inTheaters = daysSince >= -14 && daysSince <= 120;
                if (!inTheaters) return null;
                return (
                  <p className="text-white/80 text-sm mb-4">
                    <span className="text-white/60">En cines:</span> {daysSince < 0 ? "Próximamente" : "Disponible"}
                  </p>
                );
              })()}

              {data.overview ? (
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-sm mb-2">Descripción</h3>
                  <p className="text-white/85 text-sm leading-relaxed">{data.overview}</p>
                </div>
              ) : (
                <p className="text-white/60 text-sm">Sin descripción.</p>
              )}
              </div>
            </div>
            {data.backdrop_path ? (
              <div className="relative h-32 sm:h-40 mx-6 mb-4 rounded-xl overflow-hidden">
                <img
                  src={`${BACKDROP_BASE}${data.backdrop_path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
