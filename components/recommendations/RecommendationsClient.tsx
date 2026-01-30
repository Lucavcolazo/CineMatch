"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { TitleCard } from "@/components/discover/TitleCard";
import { TitleModal } from "@/components/discover/TitleModal";
import { cacheGet, cacheSet, RECOMMENDATIONS_CACHE_TTL_MS } from "@/lib/cache";
import type { MediaType } from "@/lib/tmdb";

type RecommendationItem = {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
};

type Props = {
  initialItems: RecommendationItem[];
  region: string;
  regionLabel: string;
  genreNames: string[];
  providerNames: string[];
  /** true cuando no hubo resultados con los filtros y se mostraron tendencias solo por región */
  isFallbackResults?: boolean;
};

export function RecommendationsClient({
  initialItems,
  region,
  regionLabel,
  genreNames,
  providerNames,
  isFallbackResults = false,
}: Props) {
  const [items, setItems] = useState<RecommendationItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mediaType: MediaType; id: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function dedupeItems(arr: RecommendationItem[]): RecommendationItem[] {
    const seen = new Set<string>();
    return arr.filter((it) => {
      const key = `${it.media_type}-${it.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    const cacheKey = `recommendations:${nextPage}:${isFallbackResults ? "fallback" : "prefs"}`;
    const cached = cacheGet<{ results: RecommendationItem[]; total_pages: number }>(cacheKey);

    if (cached) {
      setItems((prev) => {
        const seen = new Set(prev.map((p) => `${p.media_type}-${p.id}`));
        const added = cached.results.filter((it) => !seen.has(`${it.media_type}-${it.id}`));
        return added.length ? [...prev, ...added] : prev;
      });
      setPage(nextPage);
      setHasMore(nextPage < cached.total_pages);
      return;
    }

    setLoading(true);
    try {
      const url = isFallbackResults
        ? `/api/recommendations?page=${nextPage}&fallback=1`
        : `/api/recommendations?page=${nextPage}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      const newResults = (data.results ?? []) as RecommendationItem[];
      cacheSet(
        cacheKey,
        { results: newResults, total_pages: data.total_pages ?? 1 },
        RECOMMENDATIONS_CACHE_TTL_MS
      );
      setItems((prev) => {
        const seen = new Set(prev.map((p) => `${p.media_type}-${p.id}`));
        const added = newResults.filter((it) => !seen.has(`${it.media_type}-${it.id}`));
        return added.length ? [...prev, ...added] : prev;
      });
      setPage(nextPage);
      setHasMore(nextPage < (data.total_pages ?? 1));
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, isFallbackResults]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const list = dedupeItems(items);

  return (
    <>
      <div className="max-w-[896px] mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-white mb-4">Recomendaciones</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-white/80">
          <span className="font-medium text-white/90">Preferencias:</span>
          <span>{regionLabel}</span>
          <span aria-hidden>·</span>
          <span>{genreNames.length > 0 ? genreNames.join(", ") : "Cualquiera"}</span>
          <span aria-hidden>·</span>
          <span>{providerNames.length > 0 ? providerNames.join(", ") : "Cualquiera"}</span>
        </div>
        {isFallbackResults && (
          <p className="mb-6 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
            No encontramos títulos con tus filtros exactos. Mostrando tendencias en tu región.
          </p>
        )}
        {/* Grid fijo de 5 columnas de 160px en desktop; en móvil 2–3 columnas para no desbordar */}
        {list.length === 0 ? (
          <div className="text-center py-12 text-white/80">
            <p className="mb-4">No encontramos títulos con esos filtros.</p>
            <p className="text-sm text-white/60 mb-6">
              Probá ampliar géneros o plataformas en tu perfil para ver más recomendaciones.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
            >
              Ir al perfil
            </Link>
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,160px)] justify-center gap-4 max-w-[896px] mx-auto">
          {list.map((it, index) => {
            const title = it.title ?? it.name ?? "Sin título";
            return (
              <div
                key={`${it.media_type}-${it.id}-${index}`}
                className="animate-discover-card"
                style={{ animationDelay: `${index * 32}ms` }}
              >
                <TitleCard
                  id={it.id}
                  mediaType={it.media_type}
                  title={title}
                  posterPath={it.poster_path ?? null}
                  onSelect={() => setModal({ mediaType: it.media_type, id: it.id })}
                  region={region}
                />
              </div>
            );
          })}
        </div>
        )}
        <div ref={sentinelRef} className="h-16 flex items-center justify-center py-4" aria-hidden>
          {loading && (
            <div className="h-0.5 w-20 rounded-full bg-white/15 animate-pulse" aria-hidden />
          )}
          {!hasMore && items.length > 0 && (
            <span className="text-white/40 text-xs">No hay más títulos</span>
          )}
        </div>
      </div>
      {modal && (
        <TitleModal
          mediaType={modal.mediaType}
          id={modal.id}
          onClose={() => setModal(null)}
          region={region}
        />
      )}
    </>
  );
}
