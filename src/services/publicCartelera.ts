/**
 * Cartelera pública: shows vigentes y sponsors, pedidos UNA vez a /api/cartelera
 * (Cloudflare guarda la respuesta 5 minutos). Así los visitantes no leen Firebase directamente.
 * Devuelve los datos "crudos" (id + campos); cada servicio los normaliza a su manera.
 */

type FsValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: FsValue[] };
  mapValue?: { fields?: Record<string, FsValue> };
};

function fromFsValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue?.values ?? []).map(fromFsValue);
  if ('mapValue' in v) return fromFsFields(v.mapValue?.fields ?? {});
  return null;
}

function fromFsFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = fromFsValue(value);
  return out;
}

export interface RawDoc {
  id: string;
  data: Record<string, unknown>;
}

export interface PublicCartelera {
  shows: RawDoc[];
  sponsors: RawDoc[];
}

type RestDoc = { name: string; fields?: Record<string, FsValue> };

const toRawDocs = (docs: RestDoc[] | undefined): RawDoc[] =>
  (docs ?? []).map((d) => ({
    id: String(d.name).split('/').pop() ?? '',
    data: fromFsFields(d.fields ?? {}),
  }));

// Las dos suscripciones (shows y sponsors) comparten la misma consulta
let cached: { at: number; promise: Promise<PublicCartelera> } | null = null;
const CLIENT_CACHE_MS = 60 * 1000;

export function getPublicCartelera(): Promise<PublicCartelera> {
  const now = Date.now();
  if (cached && now - cached.at < CLIENT_CACHE_MS) return cached.promise;

  const promise = (async () => {
    const res = await fetch('/api/cartelera');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { shows?: RestDoc[]; sponsors?: RestDoc[]; error?: string };
    if (json.error) throw new Error(json.error);
    return { shows: toRawDocs(json.shows), sponsors: toRawDocs(json.sponsors) };
  })();

  cached = { at: now, promise };
  // Si falla, no se guarda el error: el próximo intento vuelve a pedirla
  promise.catch(() => {
    if (cached && cached.promise === promise) cached = null;
  });
  return promise;
}

export const PUBLIC_REFRESH_MS = 5 * 60 * 1000;
