import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  increment 
} from 'firebase/firestore';
import { db } from '../firebase';

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
      console.warn('Firestore metrics listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Registra un clic en "Comprar Entradas" para un recital
 */
export async function trackTicketClick(showId: string, bandName?: string): Promise<void> {
  // Actualizar inmediatamente caché local para feedback instantáneo
  try {
    const cached = localStorage.getItem(STORAGE_KEY_METRICS);
    const map: Record<string, ShowMetrics> = cached ? JSON.parse(cached) : {};
    if (!map[showId]) {
      map[showId] = { showId, bandName, ticketClicks: 0, shares: 0, favoritesCount: 0 };
    }
    map[showId].ticketClicks = (map[showId].ticketClicks || 0) + 1;
    if (bandName) map[showId].bandName = bandName;
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(map));
  } catch {
    // ignore
  }

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
