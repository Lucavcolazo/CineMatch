import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PasswordField, TextField } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
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
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    redirect(next ? next : "/discover");
  }

  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-black">
      <div className="w-full max-w-[700px] border border-white/20 rounded-2xl p-6 bg-black/30 backdrop-blur-xl text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Bienvenido</h1>
          <p className="text-white/85 text-[15px] leading-relaxed">Iniciá sesión para seguir descubriendo.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{success}</div>
        ) : null}

        <form action={login} className="flex flex-col gap-3">
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
          <SubmitButton icon={<LogIn size={18} aria-hidden="true" />}>
            Entrar
          </SubmitButton>
        </form>

        <div className="h-3.5" />
        <div className="flex flex-col gap-3">
          <p className="text-white/70 text-sm">
            ¿Olvidaste tu contraseña?{" "}
            <Link className="underline underline-offset-2 decoration-white/45 hover:decoration-white/85" href="/forgot-password">
              Recuperala acá
            </Link>
            .
          </p>
          <p className="text-white/70 text-sm">
            ¿No tenés cuenta?{" "}
            <Link className="underline underline-offset-2 decoration-white/45 hover:decoration-white/85" href="/signup">
              Creala acá
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
