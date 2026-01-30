"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Botón flotante que aparece al bajar en la página y hace scroll suave
 * hasta la sección de películas (#ver-peliculas).
 */
export function BackToMoviesButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targetId = "ver-peliculas";
    const el = document.getElementById(targetId);
    if (!el) return;

    const checkVisibility = () => {
      const rect = el.getBoundingClientRect();
      // Mostrar cuando el usuario bajó y el inicio de la sección ya no se ve (top salió del viewport)
      setVisible(rect.top < -80);
    };

    checkVisibility();
    window.addEventListener("scroll", checkVisibility, { passive: true });
    return () => window.removeEventListener("scroll", checkVisibility);
  }, []);

  const handleClick = () => {
    const el = document.getElementById("ver-peliculas");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[10] flex h-12 w-12 items-center justify-center rounded-full bg-white/15 border border-white/25 text-white shadow-lg hover:bg-white/25 hover:border-white/35 transition-colors"
      aria-label="Volver arriba a las películas"
    >
      <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
