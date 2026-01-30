"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { updatePreferences } from "@/lib/actions/user";
import { PLATFORMAS } from "@/lib/providerColors";
import type { TmdbGenre } from "@/lib/tmdb";

const REGIONES: { value: string; label: string }[] = [
  { value: "AR", label: "Argentina" },
  { value: "US", label: "Estados Unidos" },
  { value: "ES", label: "España" },
  { value: "MX", label: "México" },
  { value: "CO", label: "Colombia" },
  { value: "CL", label: "Chile" },
  { value: "BR", label: "Brasil" },
  { value: "FR", label: "Francia" },
  { value: "DE", label: "Alemania" },
  { value: "IT", label: "Italia" },
  { value: "GB", label: "Reino Unido" },
];

type Props = {
  genres: TmdbGenre[];
  initialRegions: string[];
  initialGenres: number[];
  initialProviders: number[];
};

export function ProfilePreferencesForm({
  genres,
  initialRegions,
  initialGenres,
  initialProviders,
}: Props) {
  const router = useRouter();
  const [regions, setRegions] = useState<string[]>(initialRegions);
  const [genreIds, setGenreIds] = useState<number[]>(initialGenres);
  const [providerIds, setProviderIds] = useState<number[]>(initialProviders);
  const [saving, setSaving] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!regionRef.current?.contains(target)) setRegionOpen(false);
      if (!genreRef.current?.contains(target)) setGenreOpen(false);
      if (!providerRef.current?.contains(target)) setProviderOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRegion = useCallback((value: string) => {
    setRegions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  }, []);

  const toggleGenre = useCallback((id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }, []);

  const toggleProvider = useCallback((id: number) => {
    setProviderIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      await updatePreferences({
        regions,
        genres: genreIds,
        providers: providerIds,
        nextPath: "/profile",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [regions, genreIds, providerIds, router]);

  const regionLabel =
    regions.length > 0
      ? regions.map((r) => REGIONES.find((x) => x.value === r)?.label ?? r).join(", ")
      : "Cualquiera";

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-sm">
        Región, géneros y plataformas para descubrir contenido. Se usan en Discover.
      </p>

      <div className="space-y-4">
        <div className="relative" ref={regionRef}>
          <label className="block text-white/90 text-sm font-medium mb-2">Regiones</label>
          <button
            type="button"
            onClick={() => setRegionOpen((o) => !o)}
            className="w-full max-w-md flex items-center justify-between rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/30"
            aria-expanded={regionOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">{regionLabel}</span>
            <ChevronDown size={18} className={regionOpen ? "rotate-180" : ""} />
          </button>
          {regionOpen && (
            <div
              className="absolute left-0 right-0 max-w-md top-full mt-1 rounded-xl border border-white/20 bg-zinc-900 shadow-xl max-h-48 overflow-y-auto z-10"
              role="listbox"
            >
              {REGIONES.map((r) => {
                const checked = regions.includes(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleRegion(r.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "bg-white/30 border-white/50" : "border-white/30"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={genreRef}>
          <label className="block text-white/90 text-sm font-medium mb-2">Géneros</label>
          <button
            type="button"
            onClick={() => setGenreOpen((o) => !o)}
            className="w-full max-w-md flex items-center justify-between rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/30"
            aria-expanded={genreOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {genreIds.length > 0
                ? genreIds.map((id) => genres.find((g) => g.id === id)?.name ?? id).join(", ")
                : "Cualquiera"}
            </span>
            <ChevronDown size={18} className={genreOpen ? "rotate-180" : ""} />
          </button>
          {genreOpen && (
            <div
              className="absolute left-0 right-0 max-w-md top-full mt-1 rounded-xl border border-white/20 bg-zinc-900 shadow-xl max-h-48 overflow-y-auto z-10"
              role="listbox"
            >
              {genres.map((g) => {
                const checked = genreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleGenre(g.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "bg-white/30 border-white/50" : "border-white/30"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={providerRef}>
          <label className="block text-white/90 text-sm font-medium mb-2">Plataformas</label>
          <button
            type="button"
            onClick={() => setProviderOpen((o) => !o)}
            className="w-full max-w-md flex items-center justify-between rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/30"
            aria-expanded={providerOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {providerIds.length > 0
                ? providerIds.map((id) => PLATFORMAS.find((p) => p.id === id)?.name ?? id).join(", ")
                : "Cualquiera"}
            </span>
            <ChevronDown size={18} className={providerOpen ? "rotate-180" : ""} />
          </button>
          {providerOpen && (
            <div
              className="absolute left-0 right-0 max-w-md top-full mt-1 rounded-xl border border-white/20 bg-zinc-900 shadow-xl max-h-48 overflow-y-auto z-10"
              role="listbox"
            >
              {PLATFORMAS.map((p) => {
                const checked = providerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleProvider(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "bg-white/30 border-white/50" : "border-white/30"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar preferencias"}
      </button>
    </div>
  );
}
