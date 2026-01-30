"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { TitleCard } from "@/components/discover/TitleCard";
import { TitleModal } from "@/components/discover/TitleModal";
import type { MediaType } from "@/lib/tmdb";

type SearchItem = {
  id: number;
  media_type: MediaType | "person";
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mediaType: MediaType; id: number } | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 400);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const raw = (data.results ?? []) as SearchItem[];
        setResults(raw);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const list = useMemo(() => {
    const items = results.filter((r) => r.media_type !== "person") as (SearchItem & { media_type: MediaType })[];
    if (debouncedQuery.length < 2) return items;
    const fuse = new Fuse(items, {
      keys: ["title", "name"],
      threshold: 0.4,
      includeScore: true,
    });
    const searched = fuse.search(debouncedQuery);
    return searched.length > 0
      ? searched.map((r) => r.item)
      : items;
  }, [results, debouncedQuery]);

  return (
    <div className="min-h-screen bg-black text-white pt-[57px]">
      <div className="sticky top-[57px] z-[999] border-b border-white/[0.06] bg-black/70 backdrop-blur-xl px-4 py-3">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center flex-1 min-w-[200px]">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar películas o series..."
                className="w-full min-w-0 rounded-lg border border-white/20 bg-white/5 text-white pl-3 pr-9 py-2.5 text-sm placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
              {loading ? (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-sm pointer-events-none">
                  Buscando...
                </span>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                  <Search size={18} />
                </span>
              )}
            </form>
          </div>
          {debouncedQuery.length >= 1 && (
            <p className="text-white/70 text-sm mt-2">
              {debouncedQuery.length < 2
                ? "Escribí al menos 2 caracteres."
                : `Resultados para "${debouncedQuery}"`}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Grilla con celdas fijas de 160px para pósteres unificados (160×240) */}
        <div className="grid grid-cols-[repeat(auto-fill,160px)] justify-center gap-4">
          {list.map((it, index) => {
            const mediaType = (it.media_type ?? "movie") as MediaType;
            const title = it.title ?? it.name ?? "Sin título";
            return (
              <TitleCard
                key={`${mediaType}-${it.id}-${index}`}
                id={it.id}
                mediaType={mediaType}
                title={title}
                posterPath={it.poster_path ?? null}
                onSelect={() => setModal({ mediaType, id: it.id })}
              />
            );
          })}
        </div>
        {debouncedQuery.length >= 2 && list.length === 0 && !loading && (
          <p className="text-white/60 text-center py-8">
            No se encontraron títulos. Probá con otras palabras.
          </p>
        )}
      </div>

      {modal && (
        <TitleModal
          mediaType={modal.mediaType}
          id={modal.id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
