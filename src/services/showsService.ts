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
import { INITIAL_SHOWS } from '../data/mockShows';
import { formatProperCase } from '../utils/textFormatting';

const SHOWS_COLLECTION = 'shows';
const LOCAL_STORAGE_SHOWS_LIST = 'mdqshow_all_shows_v4';

/**
 * Obtiene la lista local guardada o el fallback de shows iniciales
 */
export function getLocalFallbackShows(): Show[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHOWS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((s) => s && s.id)
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
  return INITIAL_SHOWS.map((s) => ({
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
 * Escucha cambios en tiempo real en la colección de shows directamente desde Firestore
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
        // Si la base en la nube estuviera completamente vacía, sembramos los shows reales iniciales
        const localShows = getLocalFallbackShows();
        if (localShows.length > 0) {
          await seedInitialShows(localShows);
        }
        onUpdate(localShows);
        isSeeding = false;
        return;
      }

      const showsList: Show[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Show;
        showsList.push({
          ...data,
          id: docSnap.id,
          venue: formatProperCase(data.venue),
          venueAddress: formatProperCase(data.venueAddress),
          ticketPortalName: formatProperCase(data.ticketPortalName) || 'Boletería Oficial',
        });
      });

      // Actualizar localStorage como caché de respaldo sincronizada
      try {
        localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(showsList));
      } catch {
        // ignore
      }

      onUpdate(showsList);
    },
    (err) => {
      console.warn('Firestore shows listener fallback:', err.message || err);
      // Servir la lista de shows desde la caché local sin interrumpir la experiencia del usuario
      onUpdate(getLocalFallbackShows());
      if (onError) onError(err);
    }
  );

  return unsubscribe;
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

  // Actualizar inmediatamente la caché local
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
  const docRef = doc(db, SHOWS_COLLECTION, sanitizedShow.id);
  await setDoc(docRef, sanitizedShow, { merge: true });
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

