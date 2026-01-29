import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PasswordField, TextField } from "@/lib/ui/AuthFields";
import { LogIn } from "lucide-react";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string; success?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  const { next, error, success } = await props.searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Por simplicidad v1, usamos redirect con query param.
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    redirect(next ? next : "/discover");
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Bienvenido</div>
          <div className="authSubtitle">Iniciá sesión para seguir descubriendo.</div>
        </div>

        {error ? <div className="notice noticeError">{error}</div> : null}
        {success ? <div className="notice noticeSuccess">{success}</div> : null}

        <form action={login} className="form">
          <TextField
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            icon="mail"
          />
          <PasswordField
            name="password"
            placeholder="Contraseña"
            required
            autoComplete="current-password"
            icon="lock"
          />
          <button className="buttonPrimary" type="submit">
            <LogIn size={18} aria-hidden="true" />
            Entrar
          </button>
        </form>

        <div style={{ height: 14 }} />
        <div className="stack">
          <p className="muted">
            ¿Olvidaste tu contraseña?{" "}
            <Link className="link" href="/forgot-password">
              Recuperala acá
            </Link>
            .
          </p>
          <p className="muted">
            ¿No tenés cuenta?{" "}
            <Link className="link" href="/signup">
              Creala acá
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

