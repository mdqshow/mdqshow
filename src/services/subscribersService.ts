import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Subscriber {
  id: string;
  email: string;
  instantAlerts: boolean;
  weeklyDigest: boolean;
  favoriteGenre: string;
  subscribedAt: string;
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
