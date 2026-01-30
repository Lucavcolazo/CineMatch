import Link from "next/link";

export default async function SignupConfirmPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await props.searchParams;

  return (
    <div className="min-h-screen grid place-items-center p-7 pt-20 bg-black">
      <div className="w-full max-w-[480px] border border-white/10 rounded-2xl p-6 bg-black text-white shadow-xl">
        <div className="flex flex-col gap-1.5 mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Revisá tu email</h1>
          <p className="text-white/85 text-[15px] leading-relaxed">
            Te enviamos un correo para validar tu cuenta. Seguí el enlace del mail y después iniciá
            sesión.
          </p>
        </div>

        <div className="rounded-xl border border-white/30 bg-white/10 text-white/90 px-3 py-2.5 text-[13px] leading-snug">
          {email ? (
            <>
              Enviamos el mensaje a <strong>{email}</strong>. Si no lo ves, revisá la carpeta de
              spam o promociones.
            </>
          ) : (
            <>Te enviamos un correo de confirmación a la dirección que usaste en el registro.</>
          )}
        </div>

        <div className="h-3.5" />
        <p className="text-white/70 text-sm">
          Cuando hayas confirmado tu cuenta, podés{" "}
          <Link className="underline underline-offset-2 decoration-white/45 hover:decoration-white/85" href="/login">
            ir al login
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
