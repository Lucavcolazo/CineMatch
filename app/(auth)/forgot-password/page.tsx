import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TextField } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ArrowLeft, Send } from "lucide-react";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await props.searchParams;

  async function sendReset(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const supabase = await createSupabaseServerClient();
    const h = await headers();
    const origin = h.get("origin");
    const redirectTo = origin ? `${origin}/reset-password` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/forgot-password?success=${encodeURIComponent(
        "Si el email existe, te enviamos un enlace para recuperar tu contraseña.",
      )}`,
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-black">
      <div className="w-full max-w-[480px] border border-white/20 rounded-2xl p-6 bg-black/30 backdrop-blur-xl text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Recuperar contraseña</h1>
          <p className="text-white/85 text-[15px] leading-relaxed">
            Te enviamos un enlace para que puedas elegir una nueva contraseña.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-white/40 bg-white/15 text-white px-3 py-2.5 text-sm mb-3">{success}</div>
        ) : null}

        <form action={sendReset} className="flex flex-col gap-3">
          <TextField
            name="email"
            type="email"
            placeholder="Tu email"
            required
            autoComplete="email"
            icon="mail"
          />
          <SubmitButton icon={<Send size={18} aria-hidden="true" />}>
            Enviar enlace
          </SubmitButton>
        </form>

        <div className="h-3.5" />
        <p className="text-white/70 text-sm">
          <Link className="underline underline-offset-2 decoration-white/45 hover:decoration-white/85 inline-flex items-center gap-2" href="/login">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
