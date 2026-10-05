/**
 * Utilidad para detectar automáticamente el nombre y portal de la ticketera a partir de la URL
 */

export interface KnownPortal {
  domainKey: string;
  name: string;
}

const KNOWN_PORTAL_DOMAINS: KnownPortal[] = [
  { domainKey: 'allaccess', name: 'AllAccess' },
  { domainKey: 'articket', name: 'Articket' },
  { domainKey: 'entradauno', name: 'EntradaUno' },
  { domainKey: 'ticketek', name: 'Ticketek' },
  { domainKey: 'passline', name: 'Passline' },
  { domainKey: 'plateanet', name: 'PlateaNet' },
  { domainKey: 'tuentrada', name: 'TuEntrada' },
  { domainKey: 'venti', name: 'Venti' },
  { domainKey: 'arteinfernal', name: 'Arte Infernal' },
  { domainKey: 'livepass', name: 'Livepass' },
  { domainKey: 'movistararena', name: 'Movistar Arena' },
  { domainKey: 'ticketportal', name: 'Ticketportal' },
  { domainKey: 'edenentradas', name: 'Edén Entradas' },
  { domainKey: 'alpogo', name: 'Alpogo' },
  { domainKey: 'eventbrite', name: 'Eventbrite' },
  { domainKey: 'ticketflash', name: 'Ticketflash' },
  { domainKey: 'coolco', name: 'Coolco' },
  { domainKey: 'ticketbox', name: 'TicketBox' },
  { domainKey: 'autoentrada', name: 'Autoentrada' },
  { domainKey: 'tickethoy', name: 'TicketHoy' },
  { domainKey: 'boleteria', name: 'Boletería del lugar' }
];

/**
 * Devuelve el dominio (sin "www.") si el texto parece una dirección web; si no, null.
 */
function extractHostname(raw: string): string | null {
  try {
    const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : 'https://' + raw;
    const hostname = new URL(withProtocol).hostname.replace(/^www\./, '');
    return hostname.includes('.') ? hostname : null;
  } catch {
    return null;
  }
}

/**
 * Detecta el nombre de la ticketera a partir de cualquier texto o URL ingresada.
 * Funciona si se pega con https://, http://, www o texto simple.
 * Si es una dirección web, compara solo contra el dominio (no contra el resto del link),
 * así una palabra dentro de la ruta no se confunde con otra ticketera.
 */
export function detectTicketPortalFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim().toLowerCase();
  if (clean.length < 3) return null;

  // 1. Coincidencia con las ticketeras conocidas
  const hostForMatch = extractHostname(clean);
  if (hostForMatch) {
    const labels = hostForMatch.split('.');
    for (const item of KNOWN_PORTAL_DOMAINS) {
      // Las claves cortas deben coincidir exactas con una parte del dominio; las largas pueden estar contenidas
      const found = labels.some((label) =>
        item.domainKey.length >= 8 ? label.includes(item.domainKey) : label === item.domainKey
      );
      if (found) return item.name;
    }
  } else {
    // Texto simple (por ejemplo "ticketek")
    for (const item of KNOWN_PORTAL_DOMAINS) {
      const found = item.domainKey.length >= 6 ? clean.includes(item.domainKey) : clean === item.domainKey;
      if (found) return item.name;
    }
  }

  // 2. Si es una URL con protocolo o dominio, extraer el hostname
  try {
    let urlToParse = clean;
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsed = new URL(urlToParse);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const brand = parts[0];
      if (brand && brand.length > 2 && !['com', 'ar', 'net', 'org', 'gob', 'io'].includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
  } catch {
    // Si no es URL parseable, ignorar
  }

  return null;
}
