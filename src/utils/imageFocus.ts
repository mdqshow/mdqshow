/**
 * Encuadre de la foto de un recital.
 * La imagen no se recorta ni se vuelve a subir: solo se guarda qué punto de la foto
 * queda "en el centro" de la tarjeta (en porcentaje, de 0 a 100 en horizontal y vertical).
 * Los shows viejos, que solo tenían "arriba / centro / abajo", siguen viéndose igual.
 */
export interface ImageFocusSource {
  imagePosition?: 'top' | 'center' | 'bottom';
  imageFocusX?: number;
  imageFocusY?: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function getImageObjectPosition(show: ImageFocusSource): string {
  const legacyY = show.imagePosition === 'bottom' ? 100 : show.imagePosition === 'center' ? 50 : 0;
  const x = typeof show.imageFocusX === 'number' && Number.isFinite(show.imageFocusX) ? clamp(show.imageFocusX) : 50;
  const y = typeof show.imageFocusY === 'number' && Number.isFinite(show.imageFocusY) ? clamp(show.imageFocusY) : legacyY;
  return `${x}% ${y}%`;
}
