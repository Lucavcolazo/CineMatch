// Todas las validaciones de entorno están acá para fallar rápido y con mensajes claros.
// Comentarios en español por requerimiento del proyecto.

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Creá un .env.local o exportala en tu entorno.`
    );
  }
  return value;
}

