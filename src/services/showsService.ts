import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Show } from '../types';
import { INITIAL_SHOWS } from '../data/mockShows';
import { formatProperCase } from '../utils/textFormatting';

const SHOWS_COLLECTION = 'shows';
const LOCAL_STORAGE_SHOWS_LIST = 'mdqshow_all_shows_v4';
const LOCAL_STORAGE_DELETED_SHOWS = 'mdqshow_deleted_ids_v1';

/**
 * Obtiene el conjunto de IDs de shows que el usuario eliminó explícitamente
 */
export function getDeletedShowIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_SHOWS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

/**
 * Registra un show como eliminado para no resucitarlo desde cachés antiguos
 */
export function markShowAsDeletedLocally(showId: string): void {
  try {
    const current = getDeletedShowIds();
    current.add(showId);
    localStorage.setItem(LOCAL_STORAGE_DELETED_SHOWS, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

/**
 * Quita un show de los eliminados si el administrador decide crearlo o editarlo
 */
export function unmarkShowAsDeletedLocally(showId: string): void {
  try {
    const current = getDeletedShowIds();
    if (current.has(showId)) {
      current.delete(showId);
      localStorage.setItem(LOCAL_STORAGE_DELETED_SHOWS, JSON.stringify(Array.from(current)));
    }
  } catch {
    // ignore
  }
}

/**
 * Obtiene la lista local guardada o el fallback de shows iniciales
 */
export function getLocalFallbackShows(): Show[] {
  const deletedIds = getDeletedShowIds();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((s) => s && s.id && !deletedIds.has(s.id))
          .map((s) => ({
            ...s,
            venue: formatProperCase(s.venue),
            venueAddress: formatProperCase(s.venueAddress),
            ticketPortalName: formatProperCase(s.ticketPortalName) || 'Boletería Oficial',
          }));
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_SHOWS.filter((s) => !deletedIds.has(s.id)).map((s) => ({
    ...s,
    venue: formatProperCase(s.venue),
    venueAddress: formatProperCase(s.venueAddress),
    ticketPortalName: formatProperCase(s.ticketPortalName) || 'Boletería Oficial',
  }));
}

/**
 * Inicializa la base de datos en la nube con los shows existentes
 */
export async function seedInitialShows(showsToSeed: Show[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const show of showsToSeed) {
      const docRef = doc(db, SHOWS_COLLECTION, show.id);
      batch.set(docRef, show);
    }
    await batch.commit();
  } catch (error) {
    console.error('Error al inicializar shows en Firestore:', error);
  }
}

/**
 * Escucha cambios en tiempo real en la colección de shows
 */
export function subscribeToShows(
  onUpdate: (shows: Show[]) => void,
  onError?: (error: Error) => void
): () => void {
  const showsCol = collection(db, SHOWS_COLLECTION);

  let isSeeding = false;

  const unsubscribe = onSnapshot(
    showsCol,
    async (snapshot) => {
      if (snapshot.empty && !isSeeding) {
        isSeeding = true;
        // Si la base en la nube está completamente vacía por ser la primera vez, sembramos los shows locales
        const localShows = getLocalFallbackShows();
        if (localShows.length > 0) {
          await seedInitialShows(localShows);
        }
        onUpdate(localShows);
        isSeeding = false;
        return;
      }

      const deletedIds = getDeletedShowIds();
      const showsList: Show[] = [];
      snapshot.forEach((docSnap) => {
        const showId = docSnap.id;
        // Si fue marcado como eliminado, no lo incluimos
        if (!deletedIds.has(showId)) {
          const data = docSnap.data() as Show;
          showsList.push({
            ...data,
            id: showId,
            venue: formatProperCase(data.venue),
            venueAddress: formatProperCase(data.venueAddress),
            ticketPortalName: formatProperCase(data.ticketPortalName) || 'Boletería Oficial',
          });
        }
      });

      // Actualizar localStorage como cache de respaldo limpia
      try {
        localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(showsList));
      } catch {
        // ignore
      }

      onUpdate(showsList);
    },
    (err) => {
      // Si la conexión a Firestore está momentáneamente inaccesible o en modo offline
      if (err.message && (err.message.includes('unavailable') || err.message.includes('offline'))) {
        console.warn('Firestore temporalmente offline, usando caché local:', err.message);
      } else {
        console.error('Error al suscribir a Firestore shows:', err);
      }
      // Usar respaldo local si hay error de conexión
      onUpdate(getLocalFallbackShows());
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Guarda o actualiza un recital en la base de datos en la nube
 */
export async function saveShowToCloud(show: Show): Promise<void> {
  const sanitizedShow: Show = {
    ...show,
    venue: formatProperCase(show.venue),
    venueAddress: formatProperCase(show.venueAddress),
    ticketPortalName: formatProperCase(show.ticketPortalName) || 'Boletería Oficial',
  };
  const docRef = doc(db, SHOWS_COLLECTION, sanitizedShow.id);
  await setDoc(docRef, sanitizedShow, { merge: true });
}

/**
 * Elimina un recital de la base de datos en la nube
 */
export async function deleteShowFromCloud(showId: string): Promise<void> {
  const docRef = doc(db, SHOWS_COLLECTION, showId);
  await deleteDoc(docRef);
}
