"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DiscoverFilters } from "./DiscoverFilters";
import { TitleCard } from "./TitleCard";
import { TitleModal } from "./TitleModal";
import { cacheGet, cacheSet, DISCOVER_CACHE_TTL_MS } from "@/lib/cache";
import type { MediaType, TmdbGenre } from "@/lib/tmdb";

type DiscoverItem = {
  id: number;
  media_type: MediaType | "person";
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
};

type Props = {
  items: DiscoverItem[];
  genres: TmdbGenre[];
  initialRegion: string;
  initialGenres: number[];
  initialProviders?: number[];
};

export function DiscoverClient({
  items: initialItems,
  genres,
  initialRegion,
  initialGenres,
  initialProviders = [],
}: Props) {
  const searchParams = useSearchParams();
  const region = searchParams.get("region") || initialRegion;
  const genreIds = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
  const providerIds = searchParams.getAll("providers").map(Number).filter(Number.isFinite);

  const [items, setItems] = useState<DiscoverItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mediaType: MediaType; id: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Deduplicar por (media_type, id) para no repetir títulos.
  function dedupeItems(arr: DiscoverItem[]): DiscoverItem[] {
    const seen = new Set<string>();
    return arr.filter((it) => {
      const mediaType = (it.media_type ?? "movie") as string;
      const key = `${mediaType}-${it.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Al cambiar región, géneros o plataformas en la URL, reiniciar con los items que mandó el servidor (ya deduplicados).
  const filterKey = `${region}-${genreIds.join(",")}-${providerIds.join(",")}`;
  useEffect(() => {
    setItems(dedupeItems(initialItems));
    setPage(1);
    setHasMore(true);
    setLoading(false);
  }, [filterKey, initialItems]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    const cacheKey = `discover:${region}:${[...genreIds].sort().join(",")}:${[...providerIds].sort().join(",")}:${nextPage}`;
    const cached = cacheGet<{ results: DiscoverItem[]; total_pages: number }>(cacheKey);

    if (cached) {
      const normalized = cached.results.map((it) => ({
        ...it,
        media_type: (it.media_type ?? "movie") as MediaType | "person",
      }));
      setItems((prev) => {
        const seen = new Set(prev.map((p) => `${p.media_type ?? "movie"}-${p.id}`));
        const added = normalized.filter((it) => !seen.has(`${it.media_type ?? "movie"}-${it.id}`));
        return added.length ? [...prev, ...added] : prev;
      });
      setPage(nextPage);
      setHasMore(nextPage < cached.total_pages);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        region,
      });
      genreIds.forEach((id) => params.append("genres", String(id)));
      providerIds.forEach((id) => params.append("providers", String(id)));
      const res = await fetch(`/api/discover?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      const newResults = (data.results ?? []) as DiscoverItem[];
      cacheSet(
        cacheKey,
        { results: newResults, total_pages: data.total_pages ?? 1 },
        DISCOVER_CACHE_TTL_MS
      );
      const normalized = newResults.map((it) => ({
        ...it,
        media_type: (it.media_type ?? "movie") as MediaType | "person",
      }));
      setItems((prev) => {
        const seen = new Set(prev.map((p) => `${p.media_type ?? "movie"}-${p.id}`));
        const added = normalized.filter((it) => !seen.has(`${it.media_type ?? "movie"}-${it.id}`));
        return added.length ? [...prev, ...added] : prev;
      });
      setPage(nextPage);
      setHasMore(nextPage < (data.total_pages ?? 1));
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, region, genreIds, providerIds]);

  // Observer: preload cuando el usuario se acerca al final para experiencia fluida.
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

  const list = dedupeItems(items.filter((r) => r.media_type !== "person") as (DiscoverItem & { media_type: MediaType })[]);

  return (
    <>
      <DiscoverFilters
        genres={genres}
        initialRegion={initialRegion}
        initialGenres={initialGenres}
        initialProviders={initialProviders}
      />
      <div className="max-w-[1400px] mx-auto px-4 py-6 lg:pr-56">
        {/* Grilla con celdas fijas de 160px para que todos los pósteres tengan el mismo tamaño (160×240) */}
        <div className="grid grid-cols-[repeat(auto-fill,160px)] justify-center gap-4">
          {list.map((it, index) => {
            const mediaType = (it.media_type ?? "movie") as MediaType;
            const title = it.title ?? it.name ?? "Sin título";
            return (
              <div
                key={`${mediaType}-${it.id}-${index}`}
                className="animate-discover-card"
                style={{ animationDelay: `${index * 32}ms` }}
              >
                <TitleCard
                  id={it.id}
                  mediaType={mediaType}
                  title={title}
                  posterPath={it.poster_path ?? null}
                  onSelect={() => setModal({ mediaType, id: it.id })}
                  region={region}
                />
              </div>
            );
          })}
        </div>
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
