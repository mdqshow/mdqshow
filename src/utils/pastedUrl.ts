/**
 * Limpia un link pegado: saca espacios y saltos de línea, y si el mismo link quedó pegado dos veces
 * seguidas (pasa en algunos celulares y navegadores) se queda con uno solo.
 * Los textos que no son un link (por ejemplo las fotos subidas desde la computadora) no se tocan.
 */
export function cleanPastedUrl(value: string): string {
  const trimmed = (value || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  // Sin espacios ni saltos de línea adentro
  let url = trimmed.replace(/\s+/g, '');

  // Link repetido: "https://...https://..." -> se corta donde empieza el segundo "http" (si no es parte de un parámetro)
  const starts = [...url.matchAll(/https?:\/\//gi)].map((m) => m.index ?? 0);
  for (const index of starts) {
    if (index === 0) continue;
    const before = url[index - 1];
    if (!['=', '&', '?', '/', '%', ':', '#', ','].includes(before)) {
      url = url.slice(0, index);
      break;
    }
  }

  // Link repetido sin "http" en el medio: la mitad exacta es igual a la otra mitad
  if (url.length % 2 === 0) {
    const half = url.length / 2;
    if (url.slice(0, half) === url.slice(half)) url = url.slice(0, half);
  }

  return url;
}
