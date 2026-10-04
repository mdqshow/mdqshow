import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type AdminAccess = 'admin' | 'denied' | 'unknown';

/**
 * Verifica contra las reglas de seguridad reales de Firebase si la cuenta logueada es la del administrador.
 * Intenta leer un dato que solo el administrador puede leer: si Firebase lo rechaza, la cuenta no tiene permisos.
 * (No depende de ningún email escrito en el código.)
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  try {
    await getDoc(doc(db, 'subscribers', '__admin_check__'));
    return 'admin';
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'permission-denied') return 'denied';
    console.warn('No se pudo verificar el acceso de administrador:', error);
    return 'unknown';
  }
}
