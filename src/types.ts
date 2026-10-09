export interface Show {
  id: string;
  band: string;
  tourName: string;
  image: string;
  genre: string;
  city: string;
  venue: string;
  venueAddress: string;
  dates: string[]; // YYYY-MM-DD format
  time: string;
  ticketUrl: string;
  ticketPortalName: string;
  ticketPriceRange: string;
  ticketStatus?: 'disponibles' | 'ultimas_entradas' | 'agotado' | 'proximamente';
  description: string;
  featured?: boolean;
  openingActs?: string[];
  isUserAdded?: boolean;
  imagePosition?: 'top' | 'center' | 'bottom';
  imageFocusX?: number; // Encuadre de la foto: punto horizontal que se muestra (0 = izquierda, 100 = derecha)
  imageFocusY?: number; // Encuadre de la foto: punto vertical que se muestra (0 = arriba, 100 = abajo)
  createdAt?: string; // ISO string de cuándo se dio de alta
  isNewBadge?: boolean; // Novedad elegida por el administrador
  spotifyUrl?: string; // Link al perfil o playlist de Spotify del artista
}

export interface FilterState {
  searchQuery: string;
  city: string;
  month: string; // 'all' or '2026-10', etc.
  genre: string;
  venue: string;
  ticketStatus?: string;
  sortBy: 'date_asc' | 'date_desc' | 'band_asc';
}

export interface CityOption {
  id: string;
  name: string;
  country: string;
  count?: number;
}

export type SponsorEffectType = 
  | 'random'
  | 'bruto'
  | 'abbey-road'
  | 'bendu'
  | 'arena-mdp'
  | 'plaza-musica'
  | 'mute'
  | 'radio-city'
  | 'cyber-neon'
  | 'golden-shimmer'
  | 'retro-bounce'
  | 'float-glow';

export interface Sponsor {
  id: string;
  type: 'image' | 'text' | 'video';
  name: string;              // Renglón 1: Nombre del negocio / sponsor en mayúsculas
  address: string;           // Renglón 2: Dirección, zona o bajada breve
  image?: string;            // Imagen subida o URL (en tipo video se usa como portada opcional)
  video?: string;            // URL directa de un video (.mp4 / .webm) para el tipo video
  link?: string;             // Enlace web o red social (ej. Instagram)
  
  // Ubicaciones de visualización en la aplicación:
  showInPopup?: boolean;     // Salir en el pop up de inicio (5 segundos no saltable)
  showInTopBanner?: boolean; // Salir en los dos primeros de la página (bajo los filtros)
  showInFeed?: boolean;      // Salir en el resto de la página (alternando entre shows)
  
  // Configuración de estilo y animación para textos:
  effectType?: SponsorEffectType;
  bgColor?: string;          // Clases Tailwind de gradiente o fondo sólido
  textColor?: string;        // Color tipográfico del renglón 1
  subtextColor?: string;     // Color tipográfico del renglón 2
  
  isActive?: boolean;        // Pauta activa (true por defecto)
  createdAt?: string;        // Fecha de alta
  notes?: string;            // Observaciones internas del admin
}

