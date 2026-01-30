import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback tras OAuth (Google, etc.): intercambia el code por sesión y redirige.
 * En Supabase Dashboard → Authentication → URL Configuration hay que tener en
 * "Redirect URLs" la URL de esta ruta (ej. http://localhost:3000/auth/callback).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/discover";
  if (!next.startsWith("/")) next = "/discover";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Env faltante o error al intercambiar el code
    }
  }

  return NextResponse.redirect(`${origin}/ingresa`);
}
