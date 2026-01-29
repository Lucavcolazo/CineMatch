/**
 * Colores de marca por provider_id de TMDB.
 * Se usa en las tarjetas para mostrar cada plataforma con su color.
 * En el modal las plataformas se muestran con texto normal.
 */
export const PROVIDER_COLORS: Record<number, string> = {
  8: "#E50914",   // Netflix
  9: "#00A8E1",   // Amazon Prime Video
  15: "#1CE783",  // Hulu
  337: "#113CC4", // Disney+
  350: "#000000", // Apple TV+
  384: "#B81D73", // HBO Max
  531: "#0064FF", // Paramount+
  619: "#0D2240", // Star+
  386: "#FF0000", // Peacock
  2: "#00B4D8",   // Apple TV (legacy)
  3: "#FF0000",   // Google Play Movies
  10: "#00A8E1",  // Amazon Video
  192: "#FF0000", // YouTube
};

export function getProviderColor(providerId: number): string {
  return PROVIDER_COLORS[providerId] ?? "#A3A3A3";
}

/** Lista de plataformas para el filtro de discover (id TMDB + nombre). */
export const PLATFORMAS: { id: number; name: string }[] = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 350, name: "Apple TV+" },
  { id: 384, name: "HBO Max" },
  { id: 531, name: "Paramount+" },
  { id: 619, name: "Star+" },
  { id: 386, name: "Peacock" },
  { id: 15, name: "Hulu" },
  { id: 192, name: "YouTube" },
];
