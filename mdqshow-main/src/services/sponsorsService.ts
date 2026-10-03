import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Sponsor } from '../types';
import { INITIAL_SPONSORS } from '../data/mockSponsors';

const SPONSORS_COLLECTION = 'sponsors';
const LOCAL_STORAGE_SPONSORS_KEY = 'mdqshow_sponsors_v1';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Sponsors Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Obtiene la lista local guardada o el fallback de sponsors iniciales
 */
export function getLocalFallbackSponsors(): Sponsor[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SPONSORS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((s) => s && s.id);
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_SPONSORS;
}

/**
 * Inicializa la base de datos en la nube con los sponsors existentes si está vacía
 */
export async function seedInitialSponsors(sponsorsToSeed: Sponsor[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const sponsor of sponsorsToSeed) {
      const docRef = doc(db, SPONSORS_COLLECTION, sponsor.id);
      batch.set(docRef, sponsor);
    }
    await batch.commit();
  } catch (error) {
    console.error('Error al inicializar sponsors en Firestore:', error);
  }
}

export type SponsorsSource = 'cloud' | 'empty' | 'local';

/**
 * Escucha cambios en tiempo real en la colección de sponsors directamente desde Firestore.
 * Informa de dónde viene la lista: 'cloud' (la base de datos real), 'empty' (la base está vacía y se muestra
 * la lista de respaldo del código) o 'local' (falló la conexión y se muestra la copia guardada en este navegador).
 * Si la conexión se corta por un error, vuelve a intentar sola a los 5 segundos.
 */
export function subscribeToSponsors(
  onUpdate: (sponsors: Sponsor[], source: SponsorsSource, errorMessage?: string) => void,
  onError?: (error: Error) => void
): () => void {
  let stopped = false;
  let unsubscribe: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const start = () => {
    if (stopped) return;
    const sponsorsCol = collection(db, SPONSORS_COLLECTION);

    unsubscribe = onSnapshot(
      sponsorsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Base vacía: se muestra la lista de respaldo, sin escribir nada en la nube
          onUpdate(getLocalFallbackSponsors(), 'empty');
          return;
        }

        const list: Sponsor[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Sponsor;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });

        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        // La copia local solo se actualiza con datos confirmados por la nube
        if (!snapshot.metadata.hasPendingWrites) {
          try {
            localStorage.setItem(LOCAL_STORAGE_SPONSORS_KEY, JSON.stringify(list));
          } catch {
            // ignore
          }
        }

        onUpdate(list, 'cloud');
      },
      (err) => {
        console.warn('Firestore sponsors listener error:', err.message || err);
        // Se muestra la copia local, pero avisando que NO es la lista real
        onUpdate(getLocalFallbackSponsors(), 'local', err.message || String(err));
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
 * Limpia campos con valor undefined para cumplir con Firestore
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
 * Guarda o actualiza un sponsor en la base de datos en la nube y en caché local
 */
export async function saveSponsorToCloud(sponsor: Sponsor): Promise<void> {
  const payload = cleanForFirestore({
    ...sponsor,
    name: sponsor.name.trim().toUpperCase(),
    address: (sponsor.address || '').trim().toUpperCase(),
    createdAt: sponsor.createdAt || new Date().toISOString(),
    isActive: sponsor.isActive ?? true,
    showInPopup: sponsor.showInPopup ?? false,
    showInTopBanner: sponsor.showInTopBanner ?? false,
    showInFeed: sponsor.showInFeed ?? true,
  });

  // 1) Guardar en Firestore Cloud (si falla, se corta acá y no queda nada "a medias")
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, payload.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SPONSORS_COLLECTION}/${payload.id}`);
  }

  // 2) Solo con la nube confirmada, actualizar la copia local de respaldo
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SPONSORS_KEY);
    let currentList: Sponsor[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentList)) currentList = [];

    const existingIndex = currentList.findIndex(s => s.id === payload.id);
    if (existingIndex >= 0) {
      currentList[existingIndex] = payload as Sponsor;
    } else {
      currentList.unshift(payload as Sponsor);
    }
    localStorage.setItem(LOCAL_STORAGE_SPONSORS_KEY, JSON.stringify(currentList));
  } catch (err) {
    console.warn('Error al guardar sponsor en localStorage:', err);
  }
}

/**
 * Elimina un sponsor de la base de datos en la nube y de la caché local
 */
export async function deleteSponsorFromCloud(sponsorId: string): Promise<void> {
  // Eliminar en Firestore (si falla, se corta acá)
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, sponsorId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SPONSORS_COLLECTION}/${sponsorId}`);
  }

  // Con la nube confirmada, limpiar la copia local
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SPONSORS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((s: Sponsor) => s.id !== sponsorId);
        localStorage.setItem(LOCAL_STORAGE_SPONSORS_KEY, JSON.stringify(filtered));
      }
    }
  } catch {
    // ignore
  }
}

/** Normaliza un nombre para compararlo (sin tildes, mayúsculas, sin la palabra "TEATRO" al inicio) */
function normalizeSponsorName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^TEATRO\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Carga en la nube los sponsors indicados que todavía no existan (compara por ID y por nombre).
 * Nunca pisa ni duplica los que ya están. Devuelve cuántos creó.
 */
export async function importMissingSponsors(seeds: Sponsor[]): Promise<number> {
  const snapshot = await getDocs(collection(db, SPONSORS_COLLECTION));
  const existingIds = new Set<string>();
  const existingNames = new Set<string>();
  snapshot.forEach((docSnap) => {
    existingIds.add(docSnap.id);
    existingNames.add(normalizeSponsorName((docSnap.data() as Sponsor).name));
  });

  const toCreate = seeds.filter(
    (seed) => !existingIds.has(seed.id) && !existingNames.has(normalizeSponsorName(seed.name))
  );
  if (toCreate.length === 0) return 0;

  try {
    const batch = writeBatch(db);
    for (const seed of toCreate) {
      const payload = cleanForFirestore({
        ...seed,
        createdAt: seed.createdAt || new Date().toISOString(),
      });
      batch.set(doc(db, SPONSORS_COLLECTION, seed.id), payload);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SPONSORS_COLLECTION);
  }
  return toCreate.length;
}
