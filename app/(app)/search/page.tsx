import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";

/**
 * Página de búsqueda: misma interfaz que discover (navbar, tema oscuro, grid de tarjetas, modal).
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black pt-[57px]" />}>
      <SearchClient />
    </Suspense>
  );
}
