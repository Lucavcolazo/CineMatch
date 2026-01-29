import { discoverTitles } from "@/lib/tmdb";
import { PosterCarousel } from "./PosterCarousel";

export default async function LandingPage() {
  // Obtenemos películas populares para el carrusel principal.
  const moviesData = await discoverTitles({ mediaType: "movie", page: 1 });
  const movies = moviesData.results
    .filter((m) => m.poster_path)
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      title: m.title ?? m.name ?? "Sin título",
      posterUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    }));

  return (
    <main className="landingShell">
      <section className="landingInner">
        <div className="landingWelcome">
          <h1 className="welcomeText">
            Bienvenido a CineMatch, el mejor lugar para saber que ver
          </h1>
        </div>
        <section className="carouselSection">
          <PosterCarousel items={movies} />
        </section>
      </section>
    </main>
  );
}
