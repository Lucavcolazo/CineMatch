import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Nav } from "@/lib/ui/Nav";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <div className="container">
      <Nav isAuthed={Boolean(user)} />
      <div className="card">
        <div className="title">CineMatch</div>
        <p className="muted">
          Buscá películas y series, mirá en qué plataforma están disponibles y
          guardá tus favoritos para mejorar recomendaciones.
        </p>
        <div style={{ height: 14 }} />
        <div className="row">
          {user ? (
            <>
              <Link className="button" href="/discover">
                Ir a Discover
              </Link>
              <Link className="button buttonSecondary" href="/search">
                Buscar títulos
              </Link>
            </>
          ) : (
            <>
              <Link className="button" href="/login">
                Entrar
              </Link>
              <Link className="button buttonSecondary" href="/signup">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
