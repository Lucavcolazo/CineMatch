import { discoverTitles } from "@/lib/tmdb";
import { PosterCarousel } from "@/components/carousel/PosterCarousel";

export default async function LandingPage() {
  const moviesData = await discoverTitles({ mediaType: "movie", page: 2 });
  const movies = moviesData.results
    .filter((m) => m.poster_path)
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      title: m.title ?? m.name ?? "Sin título",
      posterUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    }));

  return (
    <main className="min-h-screen flex flex-col pt-[180px] px-6 pb-6 text-white relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/fondo.jpg')" }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/40 z-0" aria-hidden />
      <section className="flex-1 flex flex-col items-center justify-center max-w-[1400px] w-full mx-auto px-6 z-[2] text-center animate-welcome-enter">
        <h1 className="text-[clamp(36px,8vw,72px)] font-bold tracking-tight leading-tight text-white m-0 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          Bienvenido a CineMatch
        </h1>
        <p className="text-[clamp(16px,2.5vw,22px)] font-normal text-white/90 mt-1 m-0 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          las mejores recomendaciones
        </p>
      </section>
      <section className="max-w-[1400px] w-full mx-auto px-6 mt-auto pt-6 pb-8 relative z-[2]">
        <PosterCarousel items={movies} />
      </section>
    </main>
  );
}
