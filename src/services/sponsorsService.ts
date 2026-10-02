import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
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

/**
 * Escucha cambios en tiempo real en la colección de sponsors directamente desde Firestore
 */
export function subscribeToSponsors(
  onUpdate: (sponsors: Sponsor[]) => void,
  onError?: (error: Error) => void
): () => void {
  const sponsorsCol = collection(db, SPONSORS_COLLECTION);

  const unsubscribe = onSnapshot(
    sponsorsCol,
    async (snapshot) => {
      if (snapshot.empty) {
        // Base vacía: se muestra la lista local, sin escribir nada en la nube
        onUpdate(getLocalFallbackSponsors());
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

      // Ordenar por fecha o nombre
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Actualizar localStorage como caché de respaldo sincronizada
      try {
        localStorage.setItem(LOCAL_STORAGE_SPONSORS_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }

      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore sponsors listener fallback:', err.message || err);
      // Servir la lista de sponsors desde la caché local sin interrumpir la experiencia
      onUpdate(getLocalFallbackSponsors());
      if (onError) onError(err);
    }
  );

  return unsubscribe;
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

  // Actualizar inmediatamente la caché local
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

  // Guardar en Firestore Cloud
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, payload.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SPONSORS_COLLECTION}/${payload.id}`);
  }
}

/**
 * Elimina un sponsor de la base de datos en la nube y de la caché local
 */
export async function deleteSponsorFromCloud(sponsorId: string): Promise<void> {
  // Limpiar en localStorage
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

  // Eliminar en Firestore
  try {
    const docRef = doc(db, SPONSORS_COLLECTION, sponsorId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SPONSORS_COLLECTION}/${sponsorId}`);
  }
}
