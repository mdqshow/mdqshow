import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

/**
 * FIREBASE APP CHECK (protección contra robots y uso fuera de la web oficial)
 * Mientras la clave esté vacía, App Check queda desactivado y la web funciona igual que siempre.
 * Se completa con la "clave del sitio" (pública) de reCAPTCHA. Ver las instrucciones de configuración.
 */
const APP_CHECK_SITE_KEY = '';
const APP_CHECK_PROVIDER = 'v3' as 'v3' | 'enterprise';

const app = initializeApp(firebaseConfig);

if (APP_CHECK_SITE_KEY) {
  // En una computadora de desarrollo (localhost) Firebase imprime un código de depuración en la consola
  if (typeof self !== 'undefined' && ['localhost', '127.0.0.1'].includes(self.location.hostname)) {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    initializeAppCheck(app, {
      provider:
        APP_CHECK_PROVIDER === 'enterprise'
          ? new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY)
          : new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('No se pudo iniciar App Check:', error);
  }
}

/**
 * Conexión directa y en tiempo real a la base de datos Firestore de MDQSHOW
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Autenticación de Firebase (se usa solo para el acceso del administrador)
 */
export const auth = getAuth(app);
