import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/**
 * Inicializamos Firestore con persistencia local en IndexedDB (multi-tab manager)
 * para que cuando se alcance el límite de cuota diaria o no haya conexión,
 * la aplicación continúe funcionando velozmente usando los datos en caché
 * sin trabar la interfaz ni lanzar errores no capturados.
 */
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId || undefined
);
