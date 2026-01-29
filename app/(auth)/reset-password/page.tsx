import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-black">
      <div className="w-full max-w-[700px] border border-white/10 rounded-2xl p-6 bg-black text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Elegí una nueva contraseña</h1>
          <p className="text-white/85 text-[15px] leading-relaxed">
            Debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.
          </p>
        </div>

        <ResetPasswordForm />

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
