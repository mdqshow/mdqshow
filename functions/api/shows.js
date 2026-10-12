// Cloudflare Pages Function: /api/shows
// Entrega la cartelera desde el propio dominio (www.mdqshow.com.ar), pidiéndola a Firebase por una
// consulta común. Se usa como respaldo cuando la conexión en tiempo real no llega (por ejemplo, el
// robot de Google, que no logra completarla). Es la misma información pública que ya ve cualquier visitante.
// Guarda el resultado 60 segundos para no gastar lecturas de Firebase en cada visita.

const PROJECT_ID = 'spry-almanac-9lxdt';
const DATABASE_ID = 'ai-studio-mdqshow-e4aa46d5-8368-4e85-a64f-39e5f56ed518';
// Es la misma clave web pública que ya está en firebase-applet-config.json
const API_KEY = 'AIzaSyDRX5k7x9QwPjAyPHjp-4URruQicPytFHg';
const SITE_ORIGIN = 'https://www.mdqshow.com.ar';
const CACHE_SECONDS = 60;

async function loadAllShows() {
  const base =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/${encodeURIComponent(DATABASE_ID)}/documents/shows`;
  const documents = [];
  let pageToken = '';
  for (let page = 0; page < 10; page++) {
    const url =
      `${base}?pageSize=300&key=${encodeURIComponent(API_KEY)}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const res = await fetch(url, { headers: { Referer: SITE_ORIGIN + '/' } });
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.text()).slice(0, 400);
      } catch (e) {
        // ignore
      }
      throw new Error('Firestore HTTP ' + res.status + ' ' + detail);
    }
    const json = await res.json();
    for (const d of json.documents || []) documents.push(d);
    pageToken = json.nextPageToken || '';
    if (!pageToken) break;
  }
  return documents;
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/shows', context.request.url).toString(), { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const documents = await loadAllShows();
    const response = new Response(JSON.stringify({ documents }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        'X-Robots-Tag': 'noindex',
      },
    });
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    // Se responde 200 con el detalle del error (en vez de 502) para poder leerlo desde el navegador
    return new Response(JSON.stringify({ error: String(error && error.message ? error.message : error) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
