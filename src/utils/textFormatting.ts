/**
 * Normaliza nombres de teatros, lugares y tickeadoras
 * a formato Title Case (Primera letra en mayúscula, resto en minúscula)
 * evitando siglas o palabras en MAYÚSCULAS sostenidas (ej: 'VENTI' -> 'Venti', 'BENDU ARENA' -> 'Bendu Arena').
 */

// Palabras cortas o conectores que van en minúscula salvo al inicio
const LOWERCASE_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'o', 'a', 'al', 'con', 'por', 'para'
]);

// Excepciones conocidas con formato estandarizado
const KNOWN_CANONICAL: Record<string, string> = {
  'venti': 'Venti',
  'allaccess': 'AllAccess',
  'plateanet': 'Plateanet',
  'ticketek': 'Ticketek',
  'articket': 'Articket',
  'passline': 'Passline',
  'tuentrada': 'TuEntrada',
  'entradauno': 'EntradaUno',
  'livepass': 'Livepass',
  'ticketportal': 'Ticketportal',
  'eventbrite': 'Eventbrite',
  'coolco': 'Coolco',
  'ticketbox': 'TicketBox',
  'autoentrada': 'Autoentrada',
  'tickethoy': 'TicketHoy',
  'bendu arena': 'Bendu Arena',
  'polideportivo islas malvinas': 'Polideportivo Islas Malvinas',
  'abbey road': 'Abbey Road',
  'abbey road concert hall': 'Abbey Road Concert Hall',
  'abbey road concert bar': 'Abbey Road Concert Bar',
  'arena mar del plata': 'Arena Mar del Plata',
  'teatro radio city - roxy': 'Teatro Radio City - Roxy',
  'teatro radio city + roxy + melany': 'Teatro Radio City + Roxy + Melany',
  'teatro radio city': 'Teatro Radio City',
  'teatro auditorium': 'Teatro Auditorium',
  'teatro colon': 'Teatro Colón',
  'teatro colón': 'Teatro Colón',
  'teatro tronador': 'Teatro Tronador',
  'villa victoria ocampo': 'Villa Victoria Ocampo',
  'vorterix club': 'Vorterix Club',
  'vorterix club mar del plata': 'Vorterix Club Mar del Plata',
  'mute': 'Mute Club de Mar',
  'mute club de mar': 'Mute Club de Mar',
  'silos del puerto': 'Silos del Puerto',
  'silos del puerto (explanada puerto)': 'Silos del Puerto (Explanada Puerto)',
  'club once unidos': 'Club Once Unidos',
  'estadio jose maria minella': 'Estadio José María Minella',
  'estadio josé maría minella': 'Estadio José María Minella',
  'plaza de la musica': 'Plaza de la Música',
  'plaza de la música': 'Plaza de la Música',
  'plaza de la música mar del plata': 'Plaza de la Música Mar del Plata',
};

/**
 * Convierte cualquier texto a Capitalized / Title Case prolijo
 * Ej: "VENTI" -> "Venti"
 * Ej: "BENDU ARENA" -> "Bendu Arena"
 * Ej: "POLIDEPORTIVO ISLAS MALVINAS" -> "Polideportivo Islas Malvinas"
 */
export function formatProperCase(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  let trimmed = input.trim();
  if (!trimmed) return '';

  // Quitar sufijos redundantes como (Mar del Plata) o ( Mar del Plata )
  trimmed = trimmed.replace(/\s*\(\s*mar del plata\s*\)/gi, '').trim();

  const lower = trimmed.toLowerCase();
  if (KNOWN_CANONICAL[lower]) {
    return KNOWN_CANONICAL[lower];
  }

  // Dividir por palabras preservando separadores como guiones o barras
  return trimmed
    .split(/(\s+|-|\/|\+)/)
    .map((token, index) => {
      // Si es un separador o espacio
      if (/^(\s+|-|\/|\+)$/.test(token)) return token;

      const tokenLower = token.toLowerCase();

      // Si es una palabra conectora en minúscula y no es la primera palabra
      if (index > 0 && LOWERCASE_WORDS.has(tokenLower)) {
        return tokenLower;
      }

      // Si el token venía TODO EN MAYÚSCULAS o queremos forzar Title Case
      return tokenLower.charAt(0).toUpperCase() + tokenLower.slice(1);
    })
    .join('');
}
