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
      const cloudMap = new Map<string, Show>();

      snapshot.forEach((docSnap) => {
        const showId = docSnap.id;
        if (!deletedIds.has(showId)) {
          const data = docSnap.data() as Show;
          cloudMap.set(showId, {
            ...data,
            id: showId,
            venue: formatProperCase(data.venue),
            venueAddress: formatProperCase(data.venueAddress),
            ticketPortalName: formatProperCase(data.ticketPortalName) || 'Boletería Oficial',
          });
        }
      });

      // Recuperar shows locales para no perder shows recién creados en el cliente
      const localFallback = getLocalFallbackShows();
      localFallback.forEach((localShow) => {
        if (!deletedIds.has(localShow.id) && !cloudMap.has(localShow.id)) {
          cloudMap.set(localShow.id, localShow);
        }
      });

      const showsList: Show[] = Array.from(cloudMap.values());

      // Actualizar localStorage como cache de respaldo limpia
      try {
        localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(showsList));
      } catch {
        // ignore
      }

      onUpdate(showsList);
    },
    (err) => {
      // Manejo transparente de cuota diaria superada de Google Cloud Firestore o modo offline
      const msg = err.message || '';
      if (
        msg.includes('Quota limit exceeded') ||
        msg.includes('Quota exceeded') ||
        msg.includes('unavailable') ||
        msg.includes('offline')
      ) {
        console.warn('Firestore operando en modo caché local protegida:', msg);
      } else {
        console.warn('Firestore shows listener fallback:', msg);
      }
      // Servir la lista de shows desde la caché local sin interrumpir la experiencia del usuario
      onUpdate(getLocalFallbackShows());
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Guarda o actualiza un recital en la base de datos en la nube y en caché local permanente
 */
export async function saveShowToCloud(show: Show): Promise<void> {
  const sanitizedShow: Show = {
    ...show,
    venue: formatProperCase(show.venue),
    venueAddress: formatProperCase(show.venueAddress),
    ticketPortalName: formatProperCase(show.ticketPortalName) || 'Boletería Oficial',
  };

  // Asegurar que quede desmarcado de eliminados
  unmarkShowAsDeletedLocally(sanitizedShow.id);

  // Actualizar inmediatamente la caché local permanente
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    let currentList: Show[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentList)) currentList = [];
    
    const existingIndex = currentList.findIndex(s => s.id === sanitizedShow.id);
    if (existingIndex >= 0) {
      currentList[existingIndex] = sanitizedShow;
    } else {
      currentList.unshift(sanitizedShow);
    }
    localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(currentList));
  } catch (err) {
    console.warn('Error al guardar show en localStorage:', err);
  }

  // Guardar en Firestore Cloud
  try {
    const docRef = doc(db, SHOWS_COLLECTION, sanitizedShow.id);
    await setDoc(docRef, sanitizedShow, { merge: true });
  } catch (err) {
    console.error('Error al guardar show en Firestore Cloud:', err);
  }
}

/**
 * Elimina un recital de la base de datos en la nube
 */
export async function deleteShowFromCloud(showId: string): Promise<void> {
  const docRef = doc(db, SHOWS_COLLECTION, showId);
  await deleteDoc(docRef);
}
