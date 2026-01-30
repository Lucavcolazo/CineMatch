import {
  discoverTitles,
  getGenreMovieList,
  getReleaseDateParams,
  type MediaType,
} from "@/lib/tmdb";
import { LightRaysBackground } from "@/components/backgrounds/LightRaysBackground";
import { VerPeliculasButton } from "@/components/landing/VerPeliculasButton";
import { BackToMoviesButton } from "@/components/landing/BackToMoviesButton";
import { DiscoverClient } from "@/components/discover/DiscoverClient";

type MediaFilter = "movie" | "tv" | "both";

const defaultRegion = "";
const defaultGenres: number[] = [];
const defaultProviders: number[] = [];

export default async function LandingPage(props: {
  searchParams: Promise<{
    region?: string;
    media?: string;
    genres?: string | string[];
    providers?: string | string[];
    year_from?: string;
    year_to?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const regionParam = searchParams.region !== undefined ? searchParams.region : defaultRegion;
  const mediaParam = searchParams.media;
  const media: MediaFilter =
    mediaParam === "tv" ? "tv" : mediaParam === "movie" ? "movie" : "both";
  const genresParam = searchParams.genres;
  const providersParam = searchParams.providers;
  const yearFrom = searchParams.year_from ? Number(searchParams.year_from) : undefined;
  const yearTo = searchParams.year_to ? Number(searchParams.year_to) : undefined;
  const {
    primaryReleaseDateGte,
    primaryReleaseDateLte,
    firstAirDateGte,
    firstAirDateLte,
  } = getReleaseDateParams(yearFrom, yearTo);
  const genreIds = Array.isArray(genresParam)
    ? genresParam.map(Number).filter(Number.isFinite)
    : genresParam
      ? [Number(genresParam)].filter(Number.isFinite)
      : defaultGenres;
  const providerIds = Array.isArray(providersParam)
    ? providersParam.map(Number).filter(Number.isFinite)
    : providersParam
      ? [Number(providersParam)].filter(Number.isFinite)
      : defaultProviders;
  const regionForApi = regionParam || "AR";

  if (media === "both") {
    const [genreRes, movieRes, tvRes] = await Promise.all([
      getGenreMovieList(),
      discoverTitles({
        mediaType: "movie" as MediaType,
        region: regionForApi,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: 1,
        sortBy: "release_date.desc",
        primaryReleaseDateGte,
        primaryReleaseDateLte,
      }),
      discoverTitles({
        mediaType: "tv" as MediaType,
        region: regionForApi,
        genres: genreIds.length ? genreIds : undefined,
        providers: providerIds.length ? providerIds : undefined,
        page: 1,
        sortBy: "first_air_date.desc",
        firstAirDateGte,
        firstAirDateLte,
      }),
    ]);
    const movies = (movieRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "movie" as MediaType,
    }));
    const tvs = (tvRes.results ?? []).slice(0, 12).map((it) => ({
      ...it,
      media_type: "tv" as MediaType,
    }));
    const items = [...movies, ...tvs];
    const genres = genreRes.genres ?? [];
    return (
      <main className="min-h-screen flex flex-col text-white relative font-[var(--font-space-grotesk)]">
        <LightRaysBackground />
        {/* Hero: bloque Bienvenido centrado en el medio de la pantalla; footer abajo. */}
        <section className="min-h-screen relative px-6 pb-6 z-[2] text-center animate-welcome-enter">
          <div className="absolute inset-0 flex items-center justify-center pt-[72px] pb-16">
            <div className="px-8 py-6 bg-black/[0.06] backdrop-blur-[6px] border border-white/[0.04] rounded-2xl max-w-[90vw]">
              <h1 className="text-[clamp(36px,8vw,72px)] font-bold tracking-tight leading-tight text-white m-0 text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] drop-shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                Bienvenido a CineMatch
              </h1>
              <p className="text-[clamp(14px,2.2vw,20px)] font-normal text-white/70 mt-1 m-0 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                toca para descubrir o ingresa para más opciones
              </p>
              <VerPeliculasButton />
            </div>
          </div>
          <footer className="absolute bottom-0 left-0 right-0 pt-6 pb-2">
            <p className="text-white/60 text-xs m-0 text-center">vivecodeado por Lucky7</p>
          </footer>
        </section>
        {/* Sección Ver películas: fondo negro sólido (sin efecto de luz), grilla y filtros como discover */}
        <section
          id="ver-peliculas"
          className="relative z-[3] bg-black min-h-screen pt-[57px]"
          aria-label="Ver películas"
        >
          <DiscoverClient
            items={items}
            genres={genres}
            initialRegion={defaultRegion}
            initialGenres={defaultGenres}
            initialProviders={defaultProviders}
            initialMedia="both"
            basePath="/"
            showSearch={false}
            showRegionFilter={false}
          />
        </section>
        <BackToMoviesButton />
      </main>
    );
  }

  const mediaType: MediaType = media === "tv" ? "tv" : "movie";
  const [genreRes, firstPage] = await Promise.all([
    getGenreMovieList(),
    discoverTitles({
      mediaType,
      region: regionForApi,
      genres: genreIds.length ? genreIds : undefined,
      providers: providerIds.length ? providerIds : undefined,
      page: 1,
      sortBy: mediaType === "tv" ? "first_air_date.desc" : "release_date.desc",
      primaryReleaseDateGte,
      primaryReleaseDateLte,
      firstAirDateGte,
      firstAirDateLte,
    }),
  ]);
  const rawResults = firstPage.results ?? [];
  const items = rawResults.slice(0, 24).map((it) => ({
    ...it,
    media_type: (it.media_type ?? mediaType) as MediaType,
  }));
  const genres = genreRes.genres ?? [];

  return (
    <main className="min-h-screen flex flex-col text-white relative font-[var(--font-space-grotesk)]">
      <LightRaysBackground />
      <section className="min-h-screen relative px-6 pb-6 z-[2] text-center animate-welcome-enter">
        <div className="absolute inset-0 flex items-center justify-center pt-[72px] pb-16">
          <div className="px-8 py-6 bg-black/[0.06] backdrop-blur-[6px] border border-white/[0.04] rounded-2xl max-w-[90vw]">
            <h1 className="text-[clamp(36px,8vw,72px)] font-bold tracking-tight leading-tight text-white m-0 text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] drop-shadow-[0_0_40px_rgba(0,0,0,0.3)]">
              Bienvenido a CineMatch
            </h1>
            <p className="text-[clamp(14px,2.2vw,20px)] font-normal text-white/70 mt-1 m-0 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              toca para descubrir o ingresa para más opciones
            </p>
            <VerPeliculasButton />
          </div>
        </div>
        <footer className="absolute bottom-0 left-0 right-0 pt-6 pb-2">
          <p className="text-white/60 text-xs m-0 text-center">vivecodeado por Lucky7</p>
        </footer>
      </section>
      <section
        id="ver-peliculas"
        className="relative z-[3] bg-black min-h-screen pt-[57px]"
        aria-label="Ver películas"
      >
        <DiscoverClient
          items={items}
          genres={genres}
          initialRegion={defaultRegion}
          initialGenres={defaultGenres}
          initialProviders={defaultProviders}
          initialMedia={media}
          basePath="/"
          showSearch={false}
          showRegionFilter={false}
        />
      </section>
      <BackToMoviesButton />
    </main>
  );
}
