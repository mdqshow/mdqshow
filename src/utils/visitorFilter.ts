import { auth } from '../firebase';

/**
 * Filtros para que las métricas reflejen visitas reales:
 *  - no se cuenta al administrador logueado
 *  - no se cuentan robots ni herramientas automáticas
 *  - no se cuenta un navegador marcado como "de pruebas" (ver más abajo)
 */

const NO_COUNT_KEY = 'mdqshow_no_count';
const BOT_REGEX = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed/i;

// Para probar la web como visitante sin sumar métricas: abrir /test?nocount=1 (y /test?nocount=0 para volver a contar)
try {
  const flag = new URLSearchParams(window.location.search).get('nocount');
  if (flag === '1') localStorage.setItem(NO_COUNT_KEY, '1');
  if (flag === '0') localStorage.removeItem(NO_COUNT_KEY);
} catch {
  // ignore
}

export async function shouldCountVisit(): Promise<boolean> {
  try {
    if (BOT_REGEX.test(navigator.userAgent) || (navigator as Navigator & { webdriver?: boolean }).webdriver) return false;
  } catch {
    // ignore
  }
  try {
    if (localStorage.getItem(NO_COUNT_KEY) === '1') return false;
  } catch {
    // ignore
  }
  try {
    await auth.authStateReady();
    if (auth.currentUser) return false;
  } catch {
    // ignore
  }
  return true;
}

/** Devuelve true solo la primera vez que se pide una clave durante la visita actual (pestaña/sesión) */
export function onceThisSession(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}
