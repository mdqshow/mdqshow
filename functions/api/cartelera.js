// Cloudflare Pages Function: /api/cartelera
// Entrega la cartelera pública (shows vigentes + sponsors) desde el propio dominio.
// La respuesta se guarda 5 minutos: aunque entren muchísimas visitas, Firebase se consulta
// como mucho una vez cada 5 minutos, y los visitantes no gastan lecturas de la base de datos.
// El administrador NO usa esto: sigue viendo todo en tiempo real.

const PROJECT_ID = 'spry-almanac-9lxdt';
const DATABASE_ID = 'ai-studio-mdqshow-e4aa46d5-8368-4e85-a64f-39e5f56ed518';
// Es la misma clave web pública que ya está en firebase-applet-config.json
const API_KEY = 'AIzaSyDRX5k7x9QwPjAyPHjp-4URruQicPytFHg';
const SITE_ORIGIN = 'https://www.mdqshow.com.ar';
const CACHE_SECONDS = 300;

async function loadCollection(collectionId) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/${encodeURIComponent(DATABASE_ID)}/documents:runQuery?key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: SITE_ORIGIN + '/' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], limit: 500 } }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 300);
    } catch (e) {
      // ignore
    }
    throw new Error('Firestore HTTP ' + res.status + ' ' + detail);
  }
  const rows = await res.json();
  const documents = [];
  for (const row of rows || []) {
    if (row && row.document) documents.push(row.document);
  }
  return documents;
}

function todayArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Un show terminó cuando todas sus fechas ya pasaron
function isFinished(doc, today) {
  const values =
    (doc.fields && doc.fields.dates && doc.fields.dates.arrayValue && doc.fields.dates.arrayValue.values) || [];
  const dates = values.map((v) => v.stringValue).filter(Boolean);
  if (dates.length === 0) return false;
  return dates.every((d) => d < today);
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/cartelera', context.request.url).toString(), { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const [shows, sponsors] = await Promise.all([loadCollection('shows'), loadCollection('sponsors')]);
    const today = todayArgentina();
    const body = JSON.stringify({ shows: shows.filter((doc) => !isFinished(doc, today)), sponsors });
    const response = new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        'X-Robots-Tag': 'noindex',
      },
    });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    // Se responde 200 con el detalle (no se guarda): la web lo detecta y usa la conexión en tiempo real
    return new Response(JSON.stringify({ error: String(error && error.message ? error.message : error) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
