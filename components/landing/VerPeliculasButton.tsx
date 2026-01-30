"use client";

/**
 * Botón que hace scroll suave hasta la sección #ver-peliculas.
 */
export function VerPeliculasButton() {
  const handleClick = () => {
    const el = document.getElementById("ver-peliculas");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-6 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 hover:border-white/30 transition-colors"
      aria-label="Ir a descubrir películas"
    >
      Descubrir películas
    </button>
  );
}
