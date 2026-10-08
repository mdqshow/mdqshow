import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Show } from '../types';
import { formatProperCase } from '../utils/textFormatting';

const SHOWS_COLLECTION = 'shows';
const LOCAL_STORAGE_SHOWS_LIST = 'mdqshow_all_shows_v4';

/**
 * Revisa un documento leído de la base: completa los textos y las fechas que falten,
 * para que un show mal cargado no pueda romper la página. Devuelve null si no sirve (sin banda).
 */
export function normalizeShow(raw: unknown, id: string): Show | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value : '');

  const band = text(data.band).trim();
  if (!band || !id) return null;

  const dates = Array.isArray(data.dates)
    ? (data.dates as unknown[]).filter((d): d is string => typeof d === 'string' && d.length > 0)
    : [];

  return {
    ...(data as unknown as Show),
    id,
    band,
    tourName: text(data.tourName),
    genre: text(data.genre),
    city: text(data.city),
    time: text(data.time),
    dates,
    ticketUrl: text(data.ticketUrl),
    venue: formatProperCase(text(data.venue)),
    venueAddress: formatProperCase(text(data.venueAddress)),
    ticketPortalName: formatProperCase(text(data.ticketPortalName)) || 'Boletería Oficial',
  };
}

/**
 * Devuelve la última copia de la cartelera real guardada en este navegador (solo datos que
 * ya llegaron confirmados desde la nube). Si no hay ninguna, devuelve una lista vacía:
 * ya no se muestran recitales de ejemplo.
 */
export function getLocalFallbackShows(): Show[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((s) => normalizeShow(s, s && typeof s.id === 'string' ? s.id : ''))
          .filter((s): s is Show => s !== null);
      }
    }
  } catch {
    // sin copia local
  }
  return [];
}

export type ShowsSource = 'cloud' | 'empty' | 'local';

/**
 * Escucha cambios en tiempo real en la colección de shows directamente desde Firestore.
 * Informa de dónde viene la lista: 'cloud' (la base de datos real), 'empty' (la base está vacía)
 * o 'local' (falló la conexión y se muestra la última copia real guardada en este navegador).
 * Si la conexión se corta por un error, vuelve a intentar sola.
 */
export function subscribeToShows(
  onUpdate: (shows: Show[], source: ShowsSource, errorMessage?: string) => void,
  onError?: (error: Error) => void
): () => void {
  let stopped = false;
  let unsubscribe: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const start = () => {
    if (stopped) return;
    const showsCol = collection(db, SHOWS_COLLECTION);

    unsubscribe = onSnapshot(
      showsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Base vacía: la lista queda vacía de verdad (sin recitales de ejemplo ni copias viejas)
          if (!snapshot.metadata.hasPendingWrites) {
            try {
              localStorage.removeItem(LOCAL_STORAGE_SHOWS_LIST);
            } catch {
              // ignore
            }
          }
          onUpdate([], 'empty');
          return;
        }

        const showsList: Show[] = [];
        snapshot.forEach((docSnap) => {
          const normalized = normalizeShow(docSnap.data(), docSnap.id);
          if (normalized) showsList.push(normalized);
          else console.warn('Show ignorado por estar incompleto:', docSnap.id);
        });

        // La copia local solo se actualiza con datos confirmados por la nube
        if (!snapshot.metadata.hasPendingWrites) {
          try {
            localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(showsList));
          } catch {
            // ignore
          }
        }

        onUpdate(showsList, 'cloud');
      },
      (err) => {
        console.warn('Firestore shows listener error:', err.message || err);
        // Se muestra la copia local, avisando que NO es la lista real
        onUpdate(getLocalFallbackShows(), 'local', err.message || String(err));
        if (onError) onError(err);
        // Un listener con error queda cortado: se reintenta solo.
        // Si el error es por límite de uso (cuota), se espera mucho más para no empeorarlo.
        const isQuota = (err as { code?: string }).code === 'resource-exhausted' || /quota/i.test(err.message || '');
        retryTimer = setTimeout(start, isQuota ? 5 * 60 * 1000 : 10000);
      }
    );
  };

  start();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (unsubscribe) unsubscribe();
  };
}

/**
 * Elimina recursivamente cualquier campo con valor undefined para cumplir con la API de Firestore
 */
function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Guarda o actualiza un recital en la base de datos en la nube y en caché local
 */
export async function saveShowToCloud(show: Show): Promise<void> {
  const sanitizedShow: Show = {
    ...show,
    venue: formatProperCase(show.venue),
    venueAddress: formatProperCase(show.venueAddress),
    ticketPortalName: formatProperCase(show.ticketPortalName) || 'Boletería Oficial',
  };

  const payload = cleanForFirestore(sanitizedShow);

  // Actualizar inmediatamente la caché local
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    let currentList: Show[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentList)) currentList = [];
    
    const existingIndex = currentList.findIndex(s => s.id === payload.id);
    if (existingIndex >= 0) {
      currentList[existingIndex] = payload as Show;
    } else {
      currentList.unshift(payload as Show);
    }
    localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(currentList));
  } catch (err) {
    console.warn('Error al guardar show en localStorage:', err);
  }

  // Guardar en Firestore Cloud
  const docRef = doc(db, SHOWS_COLLECTION, payload.id);
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Elimina un recital de la base de datos en la nube y de la caché local
 */
export async function deleteShowFromCloud(showId: string): Promise<void> {
  const docRef = doc(db, SHOWS_COLLECTION, showId);
  await deleteDoc(docRef);

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((s: Show) => s.id !== showId);
        localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(filtered));
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Restaura un lote completo de shows a partir de un archivo JSON de Backup
 */
export async function restoreShowsFromBackup(showsToRestore: Show[]): Promise<{ count: number }> {
  if (!Array.isArray(showsToRestore) || showsToRestore.length === 0) {
    throw new Error('El archivo no contiene un listado válido de shows');
  }

  // 1. Guardar en localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(showsToRestore));
  } catch (err) {
    console.warn('Error guardando en localStorage:', err);
  }

  // 2. Escribir en Firestore por bloques (batches de hasta 400 docs para respetar límites de Firebase)
  try {
    const BATCH_SIZE = 400;
    for (let i = 0; i < showsToRestore.length; i += BATCH_SIZE) {
      const chunk = showsToRestore.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const show of chunk) {
        if (show && show.id) {
          const sanitized: Show = {
            ...show,
            venue: formatProperCase(show.venue),
            venueAddress: formatProperCase(show.venueAddress),
            ticketPortalName: formatProperCase(show.ticketPortalName) || 'Boletería Oficial',
          };
          const docRef = doc(db, SHOWS_COLLECTION, show.id);
          batch.set(docRef, sanitized, { merge: true });
        }
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Error al restaurar lote en Firestore:', err);
    throw err;
  }

  return { count: showsToRestore.length };
}

