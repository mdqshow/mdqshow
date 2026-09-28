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
  ticketStatus: 'disponibles' | 'ultimas_entradas' | 'agotado' | 'proximamente';
  description: string;
  featured?: boolean;
  openingActs?: string[];
  isUserAdded?: boolean;
  imagePosition?: 'top' | 'center' | 'bottom';
}

export interface FilterState {
  searchQuery: string;
  city: string;
  month: string; // 'all' or '2026-10', etc.
  genre: string;
  venue: string;
  ticketStatus: string;
  sortBy: 'date_asc' | 'date_desc' | 'band_asc';
}

export interface CityOption {
  id: string;
  name: string;
  country: string;
  count?: number;
}
