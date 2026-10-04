import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  increment,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { shouldCountVisit, onceThisSession } from '../utils/visitorFilter';

export interface ShowMetrics {
  showId: string;
  bandName?: string;
  ticketClicks: number;
  shares: number;
  favoritesCount: number;
  lastUpdated?: string;
}

const METRICS_COLLECTION = 'metrics';
const STORAGE_KEY_METRICS = 'mdqshow_metrics_cache_v1';

/**
 * Escucha en tiempo real todas las métricas de los recitales
 */
export function subscribeToMetrics(
  onUpdate: (metricsMap: Record<string, ShowMetrics>) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, METRICS_COLLECTION);

  // Intentar cargar caché local primero
  try {
    const cached = localStorage.getItem(STORAGE_KEY_METRICS);
    if (cached) {
      onUpdate(JSON.parse(cached));
    }
  } catch (e) {
    // ignore
  }

  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, ShowMetrics> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          showId: d.id,
          bandName: data.bandName || '',
          ticketClicks: data.ticketClicks || 0,
          shares: data.shares || 0,
          favoritesCount: data.favoritesCount || 0,
          lastUpdated: data.lastUpdated || '',
        };
      });

      try {
        localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(map));
      } catch {
        // ignore
      }

      onUpdate(map);
    },
    (err) => {
      // Manejo silencioso y seguro de cuota excedida de Firestore o modo offline
      console.warn('Firestore metrics listener en modo local seguro:', err.message || err);
      try {
        const cached = localStorage.getItem(STORAGE_KEY_METRICS);
        if (cached) {
          onUpdate(JSON.parse(cached));
        }
      } catch {
        // ignore
      }
      if (onError) onError(err);
    }
  );
}

/**
 * Registra un clic en "Comprar Entradas" para un recital
 */
export async function trackTicketClick(showId: string, bandName?: string): Promise<void> {
  // Solo visitas reales y una vez por show en cada visita (sin administrador ni robots)
  if (!(await shouldCountVisit())) return;
  if (!onceThisSession(`mdq_tc_${showId}`)) return;

  // Registrar en Firebase Firestore
  try {
    const docRef = doc(db, METRICS_COLLECTION, showId);
    await setDoc(
      docRef,
      {
        showId,
        bandName: bandName || '',
        ticketClicks: increment(1),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error registrando ticket click en Firestore:', error);
  }
}

/**
 * Registra cuando un usuario comparte un show (WhatsApp, copiar link, etc.)
 */
export async function trackShareEvent(showId: string, bandName?: string): Promise<void> {
  if (!(await shouldCountVisit())) return;
  if (!onceThisSession(`mdq_sh_${showId}`)) return;
  try {
    const docRef = doc(db, METRICS_COLLECTION, showId);
    await setDoc(
      docRef,
      {
        showId,
        bandName: bandName || '',
        shares: increment(1),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error registrando share event en Firestore:', error);
  }
}

/**
 * Registra cuando un usuario agrega a favoritos
 */
export async function trackFavoriteEvent(showId: string, bandName?: string, delta: 1 | -1 = 1): Promise<void> {
  if (!(await shouldCountVisit())) return;
  try {
    const docRef = doc(db, METRICS_COLLECTION, showId);
    await setDoc(
      docRef,
      {
        showId,
        bandName: bandName || '',
        favoritesCount: increment(delta),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error registrando favorite event en Firestore:', error);
  }
}

export interface BannerMetrics {
  venueId: string;
  venueName: string;
  venueAddress?: string;
  impressions: number;
  clicks: number;
  lastImpressionAt?: string;
}

const BANNER_METRICS_COLLECTION = 'banner_metrics';
const STORAGE_KEY_BANNER_METRICS = 'mdqshow_banner_metrics_cache_v1';

/**
 * Escucha en tiempo real las impresiones/publicaciones de cada banner
 */
export function subscribeToBannerMetrics(
  onUpdate: (bannerMetricsMap: Record<string, BannerMetrics>) => void
): () => void {
  const colRef = collection(db, BANNER_METRICS_COLLECTION);

  try {
    const cached = localStorage.getItem(STORAGE_KEY_BANNER_METRICS);
    if (cached) {
      onUpdate(JSON.parse(cached));
    }
  } catch {
    // ignore
  }

  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, BannerMetrics> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          venueId: d.id,
          venueName: data.venueName || d.id.toUpperCase(),
          venueAddress: data.venueAddress || '',
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          lastImpressionAt: data.lastImpressionAt || '',
        };
      });

      try {
        localStorage.setItem(STORAGE_KEY_BANNER_METRICS, JSON.stringify(map));
      } catch {
        // ignore
      }

      onUpdate(map);
    },
    (err) => {
      console.warn('Firestore banner metrics listener en modo local:', err.message || err);
      try {
        const cached = localStorage.getItem(STORAGE_KEY_BANNER_METRICS);
        if (cached) onUpdate(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
  );
}

/**
 * Registra una impresión/publicación cuando un banner se muestra en pantalla
 */
export async function trackBannerImpression(venueId: string, venueName: string, venueAddress?: string): Promise<void> {
  // Solo visitas reales, y una sola vez por sponsor en cada visita
  if (!(await shouldCountVisit())) return;
  if (!onceThisSession(`mdq_imp_${venueId}`)) return;

  // Persistir en Firebase Firestore
  try {
    const docRef = doc(db, BANNER_METRICS_COLLECTION, venueId);
    await setDoc(
      docRef,
      {
        venueId,
        venueName,
        venueAddress: venueAddress || '',
        impressions: increment(1),
        lastImpressionAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('No se pudo registrar la impresión del banner:', error);
  }
}

/**
 * Registra un clic en el banner del lugar
 */
export async function trackBannerClick(venueId: string, venueName: string): Promise<void> {
  if (!(await shouldCountVisit())) return;
  if (!onceThisSession(`mdq_bc_${venueId}`)) return;
  try {
    const docRef = doc(db, BANNER_METRICS_COLLECTION, venueId);
    await setDoc(
      docRef,
      {
        venueId,
        venueName,
        clicks: increment(1),
        lastClickAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error registrando banner click en Firestore:', error);
  }
}

/**
 * Pone en cero los contadores de banners (visualizaciones y clics) y de shows (clics en entradas y compartidos).
 * NO toca favoritos, suscriptores, shows ni sponsors. Solo el administrador puede hacerlo.
 */
export async function resetMetricCounters(): Promise<void> {
  const now = new Date().toISOString();

  // Banners: se eliminan los registros (se vuelven a crear solos con las próximas visitas)
  const bannerSnap = await getDocs(collection(db, BANNER_METRICS_COLLECTION));
  const bannerRefs = bannerSnap.docs.map((d) => d.ref);
  for (let i = 0; i < bannerRefs.length; i += 400) {
    const batch = writeBatch(db);
    bannerRefs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // Shows: clics y compartidos en cero, favoritos intactos
  const showSnap = await getDocs(collection(db, METRICS_COLLECTION));
  const showRefs = showSnap.docs.map((d) => d.ref);
  for (let i = 0; i < showRefs.length; i += 400) {
    const batch = writeBatch(db);
    showRefs.slice(i, i + 400).forEach((ref) => batch.set(ref, { ticketClicks: 0, shares: 0, lastUpdated: now }, { merge: true }));
    await batch.commit();
  }

  try {
    localStorage.removeItem(STORAGE_KEY_BANNER_METRICS);
    localStorage.removeItem(STORAGE_KEY_METRICS);
  } catch {
    // ignore
  }
}
