import { Show } from '../types';
import { formatSingleDate } from './dateHelpers';

/**
 * Genera la URL para compartir un show por WhatsApp
 */
export function getWhatsAppShareUrl(show: Show): string {
  const datesText = show.dates.map((d) => formatSingleDate(d)).join(', ');
  const lines = [
    `¡Mira! *${show.band}* se presenta en Mar del Plata.`,
    `📍 *Lugar:* ${show.venue} (${show.city})`,
    `📅 *Fecha:* ${datesText}${show.time ? ` a las ${show.time}` : ''}`,
  ];
  if (show.ticketUrl) lines.push(`🎟️ *Entradas oficiales:* ${show.ticketUrl}`);
  lines.push('', 'Encontrá toda la cartelera en https://mdqshow.com.ar');

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join('\n'))}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Calcula inicio y fin del evento en formato de calendario (YYYYMMDDTHHMMSS, hora local).
 * La duración por defecto es de 3 horas; si el show termina pasada la medianoche,
 * el fin cae correctamente en el día siguiente.
 */
function buildEventTimes(show: Show, chosenDate: string): { start: string; end: string; dateCompact: string } {
  const dateCompact = chosenDate.replace(/-/g, '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chosenDate);

  let hours = 21;
  let minutes = 0;
  const timeMatch = (show.time || '').match(/(\d{1,2})(?::(\d{2}))?/);
  if (timeMatch) {
    hours = Math.min(23, Number(timeMatch[1]));
    minutes = timeMatch[2] ? Math.min(59, Number(timeMatch[2])) : 0;
  }

  if (!match) {
    // Fecha con formato inesperado: se arma igual que antes, sin cálculo de día siguiente
    const startOnly = `${dateCompact}T${pad2(hours)}${pad2(minutes)}00`;
    return { start: startOnly, end: startOnly, dateCompact };
  }

  const startDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hours, minutes));
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00`;

  return { start: fmt(startDate), end: fmt(endDate), dateCompact };
}

/**
 * Genera la URL para agregar el evento directamente a Google Calendar
 */
export function getGoogleCalendarUrl(show: Show, dateStr?: string): string {
  const chosenDate = dateStr || show.dates[0];
  if (!chosenDate) return '';

  const { start, end } = buildEventTimes(show, chosenDate);

  const title = encodeURIComponent(`${show.band} en Mar del Plata`);
  const details = encodeURIComponent(
    `Show de ${show.band} (${show.tourName || 'En Vivo'})\n` +
    `Lugar: ${show.venue} - ${show.venueAddress}\n` +
    `Entradas oficiales en ${show.ticketPortalName}: ${show.ticketUrl}\n\n` +
    `Organizado y publicado en MDQSHOW (https://mdqshow.com.ar)`
  );
  const location = encodeURIComponent(`${show.venue}, ${show.venueAddress}, Mar del Plata, Argentina`);
  const ctz = encodeURIComponent('America/Argentina/Buenos_Aires');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&ctz=${ctz}&details=${details}&location=${location}&sf=true&output=xml`;
}

/**
 * Agrega el show al calendario de forma inteligente con 1 solo clic:
 * - Si es iPhone / iPad / Mac -> descarga o abre directo el evento nativo de Apple (.ics)
 * - Si es Android / Windows / Linux -> abre directo Google Calendar
 */
export function addToDeviceCalendar(show: Show, dateStr?: string): void {
  const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
  if (isApple) {
    downloadIcsFile(show, dateStr);
  } else {
    const gcalUrl = getGoogleCalendarUrl(show, dateStr);
    if (gcalUrl) window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  }
}

// En los archivos .ics hay que "escapar" comas, punto y coma, barras y saltos de línea
const escapeIcs = (value: string) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/**
 * Genera y descarga un archivo .ics universal (para Apple Calendar, Outlook o celulares)
 */
export function downloadIcsFile(show: Show, dateStr?: string): void {
  const chosenDate = dateStr || show.dates[0];
  if (!chosenDate) return;

  const { start, end, dateCompact } = buildEventTimes(show, chosenDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MDQSHOW//Recitales Mar del Plata//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:mdqshow-${show.id}-${dateCompact}@mdqshow.com.ar`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(`${show.band} en Mar del Plata`)}`,
    `DESCRIPTION:${escapeIcs(`Show de ${show.band} en ${show.venue}. Entradas: ${show.ticketUrl}`)}`,
    `LOCATION:${escapeIcs(`${show.venue}, ${show.venueAddress}, Mar del Plata`)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const fileSlug =
    show.band
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'show';

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileSlug}_mdqshow.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
