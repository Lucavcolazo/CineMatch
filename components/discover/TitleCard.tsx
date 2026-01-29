"use client";

import { useEffect, useState } from "react";
import type { MediaType } from "@/lib/tmdb";
import { getProviderColor } from "@/lib/providerColors";

type Provider = { provider_id: number; provider_name: string };

const providersCache = new Map<string, { flatrate: Provider[] }>();

type Props = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  onSelect: () => void;
  region?: string;
};

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export function TitleCard({ id, mediaType, title, posterPath, onSelect, region = "AR" }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const posterUrl = posterPath ? `${POSTER_BASE}${posterPath}` : null;
  const typeLabel = mediaType === "movie" ? "Película" : "Serie";

  useEffect(() => {
    const key = `${mediaType}-${id}-${region}`;
    const cached = providersCache.get(key);
    if (cached) {
      setProviders(cached.flatrate);
      return;
    }
    let cancelled = false;
    const type = mediaType === "movie" || mediaType === "tv" ? mediaType : "movie";
    fetch(`/api/title/${type}/${id}/providers?region=${encodeURIComponent(region)}`)
      .then((res) => (res.ok ? res.json() : { flatrate: [] }))
      .then((data: { flatrate?: Provider[] }) => {
        if (cancelled) return;
        const flatrate = data.flatrate ?? [];
        providersCache.set(key, { flatrate });
        setProviders(flatrate);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, mediaType, region]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-black text-left focus:outline-none focus:ring-2 focus:ring-white/50"
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-white/50 text-sm">
          Sin imagen
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/95 via-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-lg">
          {title}
        </p>
        <p className="text-white/80 text-xs mt-1">{typeLabel}</p>
        {providers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {providers.slice(0, 3).map((p) => (
              <span
                key={p.provider_id}
                className="text-xs font-medium drop-shadow-md"
                style={{ color: getProviderColor(p.provider_id) }}
              >
                {p.provider_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
