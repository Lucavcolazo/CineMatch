import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogIn, UserPlus } from "lucide-react";
import { IngresaActions } from "@/components/auth/IngresaActions";

export default async function IngresaPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/discover");

  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-black">
      <div className="w-full max-w-[420px] border border-white/20 rounded-2xl p-6 bg-black/30 backdrop-blur-xl text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Ingresá a CineMatch
          </h1>
          <p className="text-white/85 text-[15px] leading-relaxed">
            Elegí cómo querés continuar.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <LogIn size={18} aria-hidden="true" />
            Ya tengo cuenta
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <UserPlus size={18} aria-hidden="true" />
            No tengo cuenta
          </Link>
          <IngresaActions />
        </div>
      </div>
    </div>
  );
}
