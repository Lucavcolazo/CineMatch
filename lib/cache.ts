/**
 * Caché en memoria con TTL (time-to-live) para el cliente.
 * Evita llamadas repetidas a la API cuando el usuario navega o recarga.
 * Comentarios en español por requerimiento del proyecto.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60 * 1000; // 1 minuto

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expiresAt;
}

/**
 * Obtiene un valor de la caché. Devuelve null si no existe o está vencido.
 */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry || isExpired(entry)) {
    if (entry) store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Guarda un valor en la caché. ttlMs: duración en milisegundos (por defecto 1 min).
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Elimina una entrada de la caché (p. ej. al cerrar sesión).
 */
export function cacheRemove(key: string): void {
  store.delete(key);
}

/**
 * Limpia toda la caché.
 */
export function cacheClear(): void {
  store.clear();
}

/** Clave de caché del perfil en el Navbar (para invalidar al cerrar sesión o editar perfil). */
export const PROFILE_CACHE_KEY = "navbar:profile";

/** TTL para perfil de usuario: 2 minutos. */
export const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;

/** TTL para resultados de discover: 5 minutos. */
export const DISCOVER_CACHE_TTL_MS = 5 * 60 * 1000;

/** TTL para resultados de recomendaciones (por usuario): 5 minutos. */
export const RECOMMENDATIONS_CACHE_TTL_MS = 5 * 60 * 1000;
