import Link from "next/link";

export default async function SignupConfirmPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await props.searchParams;

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Revisá tu email</div>
          <div className="authSubtitle">
            Te enviamos un correo para validar tu cuenta. Seguí el enlace del mail y después iniciá
            sesión.
          </div>
        </div>

        <div className="notice">
          {email ? (
            <>
              Enviamos el mensaje a <strong>{email}</strong>. Si no lo ves, revisá la carpeta de
              spam o promociones.
            </>
          ) : (
            <>Te enviamos un correo de confirmación a la dirección que usaste en el registro.</>
          )}
        </div>

        <div style={{ height: 14 }} />
        <p className="muted">
          Cuando hayas confirmado tu cuenta, podés{" "}
          <Link className="link" href="/login">
            ir al login
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

