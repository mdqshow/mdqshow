import type React from 'react';

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
  imageZoom?: number;
}

export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 3;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Zoom de la foto: 1 = sin zoom (los shows viejos no tienen este dato y se ven igual que siempre). */
export function getImageZoom(show: ImageFocusSource): number {
  const z = show.imageZoom;
  if (typeof z !== 'number' || !Number.isFinite(z)) return MIN_IMAGE_ZOOM;
  return Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, z));
}

export function getImageObjectPosition(show: ImageFocusSource): string {
  const legacyY = show.imagePosition === 'bottom' ? 100 : show.imagePosition === 'center' ? 50 : 0;
  const x = typeof show.imageFocusX === 'number' && Number.isFinite(show.imageFocusX) ? clamp(show.imageFocusX) : 50;
  const y = typeof show.imageFocusY === 'number' && Number.isFinite(show.imageFocusY) ? clamp(show.imageFocusY) : legacyY;
  return `${x}% ${y}%`;
}

/**
 * Estilo completo del encuadre (posición + zoom) para poner en el <img> con object-cover.
 * El zoom se hace desde el mismo punto del encuadre, así la foto siempre sigue llenando el marco
 * y el punto elegido queda fijo mientras se acerca.
 */
export function getImageFrameStyle(show: ImageFocusSource): React.CSSProperties {
  const objectPosition = getImageObjectPosition(show);
  const zoom = getImageZoom(show);
  if (zoom <= 1) return { objectPosition };
  return { objectPosition, transform: `scale(${zoom})`, transformOrigin: objectPosition };
}
