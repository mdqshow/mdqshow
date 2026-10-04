/**
 * Links seguros: solo se aceptan direcciones http:// o https://.
 * Evita que un link mal cargado (por ejemplo "javascript:...") se ejecute al hacer clic.
 */

/** Devuelve la dirección solo si es http(s); si no, undefined. Se usa al MOSTRAR links. */
export function safeHttpUrl(value?: string | null): string | undefined {
  const raw = (value || '').trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? raw : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Para los formularios del administrador: si falta "https://" lo agrega, y rechaza cualquier otro tipo de enlace.
 * Un campo vacío es válido (el link es opcional).
 */
export function normalizeUserUrl(value?: string | null): { url: string; valid: boolean } {
  const raw = (value || '').trim();
  if (!raw) return { url: '', valid: true };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw.replace(/^\/+/, '')}`;
  const safe = safeHttpUrl(candidate);
  return safe ? { url: safe, valid: true } : { url: '', valid: false };
}
