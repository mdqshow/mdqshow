import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/**
 * Conexión directa y en tiempo real a la base de datos Firestore de MDQSHOW
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

