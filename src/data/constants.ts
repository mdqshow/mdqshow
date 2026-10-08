// Listas fijas que usa el formulario de shows y la barra superior.
// (Antes estaban dentro de mockShows.ts, un archivo de 4 MB que hacía pesada la web.)

export const AVAILABLE_CITIES = [
  'Mar del Plata'
];

export const AVAILABLE_GENRES = [
  'Todos los géneros',
  'Rock Nacional',
  'Rock Internacional',
  'Heavy Metal / Hard Rock',
  'Punk Rock',
  'Trap / Urbano',
  'Hip Hop / Rap',
  'Pop',
  'Latino',
  'Romántico',
  'Indie Rock / Pop',
  'Rock / Ska',
  'Cumbia / Cuarteto',
  'RKT / Cumbia 420',
  'Electrónica / DJ Set',
  'Reggae / Dub',
  'Folklore',
  'Tango',
  'Jazz / Blues',
  'Funk / Soul',
  'Acústico / Cantautor',
  'Tributo / Homenaje',
  'Stand Up / Teatro',
  'Otros'
];

export interface PresetVenue {
  name: string;
  address: string;
  defaultTicketPortal?: string;
  ticketUrl?: string;
}

export const PRESET_VENUES: PresetVenue[] = [
  { 
    name: 'Abbey Road Concert Bar', 
    address: 'Av. Juan B. Justo 620', 
    defaultTicketPortal: 'Articket',
    ticketUrl: 'https://www.articket.com.ar'
  },
  { 
    name: 'Arena Mar del Plata', 
    address: 'Av. Luro y San Juan', 
    defaultTicketPortal: 'AllAccess',
    ticketUrl: 'https://www.allaccess.com.ar'
  },
  { 
    name: 'Auditorium (Centro Provincial de las Artes)', 
    address: 'Av. Patricio Peralta Ramos 2280', 
    defaultTicketPortal: 'Plateanet',
    ticketUrl: 'https://www.plateanet.com'
  },
  { 
    name: 'Bendu Arena', 
    address: 'Av. Juan B. Justo y Av. de los Trabajadores', 
    defaultTicketPortal: 'Ticketek',
    ticketUrl: 'https://www.ticketek.com.ar'
  },
  { 
    name: 'Bruto Playa Grande', 
    address: 'Playa Grande', 
    defaultTicketPortal: 'Ticketek',
    ticketUrl: 'https://www.ticketek.com.ar'
  },
  { 
    name: 'Estadio José María Minella', 
    address: 'Av. Pedro Luro y Canosa', 
    defaultTicketPortal: 'Ticketek',
    ticketUrl: 'https://www.ticketek.com.ar'
  },
  { 
    name: 'Mute Club de Mar', 
    address: 'Ruta 11, Paraje Alfar', 
    defaultTicketPortal: 'Passline',
    ticketUrl: 'https://www.passline.com'
  },
  { 
    name: 'Plaza de la Música Mar del Plata', 
    address: 'Av. Constitución 5780', 
    defaultTicketPortal: 'Articket',
    ticketUrl: 'https://www.articket.com.ar'
  },
  { 
    name: 'Polideportivo Islas Malvinas', 
    address: 'Av. Juan B. Justo y España', 
    defaultTicketPortal: 'Ticketek',
    ticketUrl: 'https://www.ticketek.com.ar'
  },
  { 
    name: 'Teatro Radio City + Roxy + Melany', 
    address: 'San Luis 1750', 
    defaultTicketPortal: 'Plateanet',
    ticketUrl: 'https://www.plateanet.com'
  },
  { 
    name: 'Teatro Tronador', 
    address: 'Santiago del Estero 1746', 
    defaultTicketPortal: 'Ticketek',
    ticketUrl: 'https://www.ticketek.com.ar'
  },
  { 
    name: 'Villa Victoria Ocampo', 
    address: 'Matheu 1851', 
    defaultTicketPortal: 'Boletería Oficial',
    ticketUrl: 'https://www.mardelplata.gob.ar'
  },
  { 
    name: 'Vorterix Club Mar del Plata', 
    address: 'Diagonal Pueyrredon 3338', 
    defaultTicketPortal: 'Articket',
    ticketUrl: 'https://www.articket.com.ar'
  }
];
