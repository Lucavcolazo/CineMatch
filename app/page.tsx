import { discoverTitles } from "@/lib/tmdb";
import { PosterCarousel } from "./PosterCarousel";

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
    <main className="landingShell">
      <section className="landingHero">
        <h1 className="welcomeTitle">Bienvenido a CineMatch</h1>
        <p className="welcomeSubtitle">las mejores recomendaciones</p>
      </section>
      <section className="carouselSection">
        <PosterCarousel items={movies} />
      </section>
    </main>
  );
}
