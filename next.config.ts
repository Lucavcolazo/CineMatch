import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Cargar .env y .env.local ANTES de leer process.env en el config.
// Next.js no los carga antes de evaluar next.config, así que lo hacemos acá.
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
