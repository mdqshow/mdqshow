import { Sponsor } from '../types';

/**
 * Un sponsor está EN PAUSA cuando no tiene ninguna de las tres ubicaciones elegidas
 * (pop-up de inicio, los dos primeros banners, resto de la página).
 */
export function isSponsorPaused(sponsor: Pick<Sponsor, 'showInPopup' | 'showInTopBanner' | 'showInFeed'>): boolean {
  const inPopup = sponsor.showInPopup === true;
  const inTop = sponsor.showInTopBanner === true;
  const inFeed = sponsor.showInFeed !== false; // sin dato = "resto de la página" (igual que en el resto de la web)
  return !inPopup && !inTop && !inFeed;
}
