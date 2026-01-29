"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { PLATFORMAS } from "@/lib/providerColors";

type TmdbGenre = { id: number; name: string };

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
  initialRegion: string;
  initialGenres: number[];
  initialProviders?: number[];
};

export function DiscoverFilters({ genres, initialRegion, initialGenres, initialProviders = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const genreDropdownRefMobile = useRef<HTMLDivElement>(null);
  const genreDropdownRefSidebar = useRef<HTMLDivElement>(null);
  const platformDropdownRefSidebar = useRef<HTMLDivElement>(null);
  const platformDropdownRefMobile = useRef<HTMLDivElement>(null);

  const setFilters = useCallback(
    (region: string, genreIds: number[], providerIds: number[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("region", region);
      params.delete("genres");
      genreIds.forEach((id) => params.append("genres", String(id)));
      params.delete("providers");
      providerIds.forEach((id) => params.append("providers", String(id)));
      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    const genresParam = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
    const providersParam = searchParams.getAll("providers").map(Number).filter(Number.isFinite);
    setFilters(
      region,
      genresParam.length ? genresParam : initialGenres,
      providersParam.length ? providersParam : initialProviders
    );
  };

  const toggleGenre = (genreId: number) => {
    const current = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
    const next = current.includes(genreId)
      ? current.filter((g) => g !== genreId)
      : [...current, genreId];
    const region = searchParams.get("region") || initialRegion;
    const providersParam = searchParams.getAll("providers").map(Number).filter(Number.isFinite);
    setFilters(region, next, providersParam.length ? providersParam : initialProviders);
  };

  const removeGenre = (genreId: number) => {
    const current = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
    const next = current.filter((g) => g !== genreId);
    const region = searchParams.get("region") || initialRegion;
    const providersParam = searchParams.getAll("providers").map(Number).filter(Number.isFinite);
    setFilters(region, next, providersParam.length ? providersParam : initialProviders);
  };

  const toggleProvider = (providerId: number) => {
    const current = searchParams.getAll("providers").map(Number).filter(Number.isFinite);
    const next = current.includes(providerId)
      ? current.filter((p) => p !== providerId)
      : [...current, providerId];
    const region = searchParams.get("region") || initialRegion;
    const genresParam = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
    setFilters(region, genresParam.length ? genresParam : initialGenres, next);
  };

  const removeProvider = (providerId: number) => {
    const current = searchParams.getAll("providers").map(Number).filter(Number.isFinite);
    const next = current.filter((p) => p !== providerId);
    const region = searchParams.get("region") || initialRegion;
    const genresParam = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
    setFilters(region, genresParam.length ? genresParam : initialGenres, next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideMobile = genreDropdownRefMobile.current?.contains(target);
      const insideSidebar = genreDropdownRefSidebar.current?.contains(target);
      const insidePlatformSidebar = platformDropdownRefSidebar.current?.contains(target);
      const insidePlatformMobile = platformDropdownRefMobile.current?.contains(target);
      if (!insideMobile && !insideSidebar) setGenreDropdownOpen(false);
      if (!insidePlatformSidebar && !insidePlatformMobile) setPlatformDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const region = searchParams.get("region") || initialRegion;
  const selectedGenres = searchParams.getAll("genres").map(Number).filter(Number.isFinite);
  const selectedProviders = searchParams.getAll("providers").map(Number).filter(Number.isFinite);

  return (
    <>
      {/* Barra de búsqueda: separada unos px de la navbar (top = altura navbar + 12px). */}
      <div className="sticky top-[69px] z-[999] mt-3 border-b border-white/10 bg-black/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-[1400px] mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar películas o series..."
              className="w-full min-w-0 rounded-lg border border-white/20 bg-white/5 text-white pl-3 pr-9 py-2.5 text-sm placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white rounded"
              aria-label="Buscar"
            >
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>
      {/* En móvil: filtros en una fila debajo de la barra (solo en pantallas sin sidebar) */}
      <div className="lg:hidden border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-2">
        <select
          id="discover-region-mobile"
          value={region}
          onChange={handleRegionChange}
          className="rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30"
        >
          {REGIONES.map((r) => (
            <option key={r.value} value={r.value} className="bg-zinc-900 text-white">
              {r.label}
            </option>
          ))}
        </select>
        <div className="relative" ref={genreDropdownRefMobile}>
          <button
            type="button"
            onClick={() => setGenreDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30 min-w-[120px]"
            aria-expanded={genreDropdownOpen}
          >
            Géneros
            <ChevronDown size={16} className={genreDropdownOpen ? "rotate-180" : ""} />
          </button>
          {genreDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1 rounded-lg border border-white/20 bg-zinc-900 shadow-xl max-h-48 overflow-y-auto min-w-[160px] z-10"
              role="listbox"
            >
              {genres.map((g) => {
                const checked = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleGenre(g.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "bg-white/30 border-white/50" : "border-white/30"}`}>
                      {checked ? "✓" : ""}
                    </span>
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedGenres.map((id) => {
              const name = genres.find((g) => g.id === id)?.name ?? String(id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-white/20 text-white px-2 py-0.5 text-xs">
                  {name}
                  <button type="button" onClick={() => removeGenre(id)} className="hover:text-red-300" aria-label={`Quitar ${name}`}>×</button>
                </span>
              );
            })}
          </div>
        )}
        <div className="relative" ref={platformDropdownRefMobile}>
          <button
            type="button"
            onClick={() => setPlatformDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30 min-w-[120px]"
            aria-expanded={platformDropdownOpen}
          >
            {selectedProviders.length === 0
              ? "Plataformas"
              : selectedProviders.length === 1
                ? PLATFORMAS.find((p) => p.id === selectedProviders[0])?.name ?? "1"
                : `${selectedProviders.length} plataformas`}
            <ChevronDown size={16} className={platformDropdownOpen ? "rotate-180" : ""} />
          </button>
          {platformDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1 rounded-lg border border-white/20 bg-zinc-900 shadow-xl max-h-48 overflow-y-auto min-w-[160px] z-10"
              role="listbox"
            >
              {PLATFORMAS.map((p) => {
                const checked = selectedProviders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleProvider(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "bg-white/30 border-white/50" : "border-white/30"}`}>
                      {checked ? "✓" : ""}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selectedProviders.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedProviders.map((id) => {
              const name = PLATFORMAS.find((p) => p.id === id)?.name ?? String(id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-white/20 text-white px-2 py-0.5 text-xs">
                  {name}
                  <button type="button" onClick={() => removeProvider(id)} className="hover:text-red-300" aria-label={`Quitar ${name}`}>×</button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      {/* Filtros al costado derecho en desktop: pt para que no queden tapados por la barra de búsqueda sticky. */}
      <aside
        className="hidden lg:block fixed right-0 top-[57px] bottom-0 w-56 border-l border-white/10 bg-black/80 backdrop-blur-sm z-[998] overflow-y-auto"
        aria-label="Filtros"
      >
        <div className="p-4 pt-24 space-y-4">
          <div>
            <label htmlFor="discover-region" className="block text-white/90 text-sm font-medium mb-2">
              País
            </label>
            <select
              id="discover-region"
              value={region}
              onChange={handleRegionChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30"
            >
              {REGIONES.map((r) => (
                <option key={r.value} value={r.value} className="bg-zinc-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative" ref={genreDropdownRefSidebar}>
            <label className="block text-white/90 text-sm font-medium mb-2">Géneros</label>
            <button
              type="button"
              onClick={() => setGenreDropdownOpen((o) => !o)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30"
              aria-expanded={genreDropdownOpen}
              aria-haspopup="listbox"
            >
              Géneros
              <ChevronDown size={16} className={genreDropdownOpen ? "rotate-180" : ""} />
            </button>
            {genreDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-white/20 bg-zinc-900 shadow-xl max-h-64 overflow-y-auto z-10"
                role="listbox"
              >
                {genres.map((g) => {
                  const checked = selectedGenres.includes(g.id);
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
          {selectedGenres.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-white/70 text-xs font-medium mb-2">Géneros</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedGenres.map((id) => {
                  const name = genres.find((g) => g.id === id)?.name ?? String(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-white/20 text-white px-2 py-0.5 text-xs"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeGenre(id)}
                        className="hover:text-red-300"
                        aria-label={`Quitar ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="relative pt-2 border-t border-white/10" ref={platformDropdownRefSidebar}>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Plataformas
              <span className="block text-white/50 text-xs font-normal">En al menos una</span>
            </label>
            <button
              type="button"
              onClick={() => setPlatformDropdownOpen((o) => !o)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30 text-left min-h-[40px]"
              aria-expanded={platformDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="truncate">
                {selectedProviders.length === 0
                  ? "Elegir plataformas"
                  : selectedProviders.length === 1
                    ? PLATFORMAS.find((p) => p.id === selectedProviders[0])?.name ?? "1 seleccionada"
                    : `${selectedProviders.length} plataformas`}
              </span>
              <ChevronDown size={16} className={`shrink-0 ${platformDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {platformDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-white/20 bg-zinc-900 shadow-xl max-h-64 overflow-y-auto z-10"
                role="listbox"
              >
                {PLATFORMAS.map((p) => {
                  const checked = selectedProviders.includes(p.id);
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
          {selectedProviders.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-white/70 text-xs font-medium mb-2">Plataformas</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProviders.map((id) => {
                  const name = PLATFORMAS.find((p) => p.id === id)?.name ?? String(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-white/20 text-white px-2 py-0.5 text-xs"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeProvider(id)}
                        className="hover:text-red-300"
                        aria-label={`Quitar ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
