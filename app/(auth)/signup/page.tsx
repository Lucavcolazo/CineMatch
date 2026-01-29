import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/SignupForm";
import { UserPlus } from "lucide-react";

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  const { error, success } = await props.searchParams;

  async function signup(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("display_name") ?? "").trim();
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (!displayName) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "El nombre de usuario es obligatorio.",
        )}`,
      );
    }

    if (password !== confirmPassword) {
      redirect(
        `/signup?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
      );
    }

    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    if (!passwordOk) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.",
        )}`,
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

    redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-white">
      <div className="w-full max-w-[700px] border border-zinc-200 rounded-2xl p-6 bg-black text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Crear cuenta</h1>
        </div>

        {error ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{success}</div>
        ) : null}

        <SignupForm signupAction={signup} />

        <button
          formAction={signup}
          type="submit"
          className="mt-3 inline-flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-white/30 bg-white text-black font-medium shadow-lg transition-all hover:brightness-105 active:translate-y-px"
        >
          <UserPlus size={18} aria-hidden="true" />
          Crear cuenta
        </button>

        <div className="h-3.5" />
        <p className="text-white/70 text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link className="underline underline-offset-2 decoration-white/45 hover:decoration-white/85" href="/login">
            Entrá acá
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
