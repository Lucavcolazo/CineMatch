import Link from "next/link";

import { ResetPasswordForm } from "@/lib/ui/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Elegí una nueva contraseña</div>
          <div className="authSubtitle">
            Debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.
          </div>
        </div>

        <ResetPasswordForm />

        <div style={{ height: 14 }} />
        <p className="muted">
          <Link className="link" href="/login">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} aria-hidden="true" />
              Volver al login
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}

