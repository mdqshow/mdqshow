import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Subscriber {
  id: string;
  email: string;
  instantAlerts: boolean;
  weeklyDigest: boolean;
  favoriteGenre: string;
  subscribedAt: string;
  /** Fecha en que el administrador lo descargó por primera vez (si falta, es un suscriptor "nuevo") */
  exportedAt?: string;
}

const SUBSCRIBERS_COLLECTION = 'subscribers';
const STORAGE_KEY_SUBSCRIBERS = 'mdqshow_subscribers';

export function subscribeToSubscribers(
  onUpdate: (subs: Subscriber[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, SUBSCRIBERS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Subscriber[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as Subscriber);
      });
      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(list));
        onUpdate(list);
      }
    },
    (err) => {
      // Manejo seguro y silencioso de cuota o modo offline
      console.warn('Firestore subscribers listener en modo local seguro:', err.message || err);
      try {
        const cached = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
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

export async function saveSubscriberToCloud(subscriber: Subscriber): Promise<void> {
  const docRef = doc(db, SUBSCRIBERS_COLLECTION, subscriber.id);
  await setDoc(docRef, subscriber, { merge: true });
}

/**
 * Marca suscriptores como "ya descargados" (no se borra nada: solo se agrega la fecha de descarga).
 * Solo el administrador puede hacerlo.
 */
export async function markSubscribersExported(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const exportedAt = new Date().toISOString();
  const CHUNK = 400; // Firestore admite hasta 500 operaciones por lote
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + CHUNK)) {
      batch.update(doc(db, SUBSCRIBERS_COLLECTION, id), { exportedAt });
    }
    await batch.commit();
  }
}
