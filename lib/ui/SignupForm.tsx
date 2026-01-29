/* Formulario de registro con validación visual de contraseña. */
"use client";

import * as React from "react";

import { PasswordField, TextField } from "@/lib/ui/AuthFields";

type Props = {
  // Server Action que crea el usuario.
  signupAction: (formData: FormData) => void;
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function SignupForm({ signupAction }: Props) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const mismatch = confirm.length > 0 && confirm !== password;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Si las contraseñas no coinciden o no cumplen la política, prevenimos el submit.
    if (mismatch || !PASSWORD_REGEX.test(password)) {
      e.preventDefault();
    }
  }

  return (
    <form action={signupAction} className="form" onSubmit={handleSubmit}>
      <TextField
        name="display_name"
        type="text"
        placeholder="Nombre de usuario"
        autoComplete="name"
        required
        icon="user"
      />
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
        autoComplete="new-password"
        icon="lock"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
        title="Mínimo 8 caracteres e incluir mayúsculas, minúsculas y números."
        minLength={8}
      />
      <PasswordField
        name="confirm_password"
        placeholder="Repetir contraseña"
        required
        autoComplete="new-password"
        icon="lock"
        value={confirm}
        onChange={(e) => setConfirm(e.currentTarget.value)}
        error={mismatch}
      />

      <p className={mismatch ? "fieldHintError" : "fieldHint"}>
        {mismatch
          ? "Las contraseñas no coinciden."
          : "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números."}
      </p>
    </form>
  );
}

