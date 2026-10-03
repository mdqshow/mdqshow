import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/**
 * Conexión directa y en tiempo real a la base de datos Firestore de MDQSHOW
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Autenticación de Firebase (se usa solo para el acceso del administrador)
 */
export const auth = getAuth(app);
