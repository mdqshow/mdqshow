import { Show } from '../types';

/**
 * Genera la URL para compartir un show por WhatsApp
 */
export function getWhatsAppShareUrl(show: Show): string {
  const datesText = show.dates.join(', ');
  const text = `¡Mira! *${show.band}* se presenta en Mar del Plata.\n` +
    `📍 *Lugar:* ${show.venue} (${show.city})\n` +
    `📅 *Fecha:* ${datesText} a las ${show.time}\n` +
    `🎟️ *Entradas oficiales:* ${show.ticketUrl}\n\n` +
    `Encontrá toda la cartelera en https://mdqshow.com.ar`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Genera la URL para agregar el evento directamente a Google Calendar
 */
export function getGoogleCalendarUrl(show: Show, dateStr?: string): string {
  const chosenDate = dateStr || show.dates[0];
  if (!chosenDate) return '';

  // Formato YYYYMMDD
  const dateCompact = chosenDate.replace(/-/g, '');

  // Horario por defecto si viene "21:00 hs" -> extraer 210000
  let startTime = '210000';
  let endTime = '233000';
  const timeMatch = show.time.match(/([0-9]{1,2}):?([0-9]{2})?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const mins = timeMatch[2] || '00';
    startTime = `${hours}${mins}00`;
    const endHour = String((Number(hours) + 3) % 24).padStart(2, '0');
    endTime = `${endHour}${mins}00`;
  }

  const startIso = `${dateCompact}T${startTime}`;
  const endIso = `${dateCompact}T${endTime}`;

  const title = encodeURIComponent(`${show.band} en Mar del Plata`);
  const details = encodeURIComponent(
    `Show de ${show.band} (${show.tourName || 'En Vivo'})\n` +
    `Lugar: ${show.venue} - ${show.venueAddress}\n` +
    `Entradas oficiales en ${show.ticketPortalName}: ${show.ticketUrl}\n\n` +
    `Organizado y publicado en MDQSHOW (https://mdqshow.com.ar)`
  );
  const location = encodeURIComponent(`${show.venue}, ${show.venueAddress}, Mar del Plata, Argentina`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&sf=true&output=xml`;
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
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Genera y descarga un archivo .ics universal (para Apple Calendar, Outlook o celulares)
 */
export function downloadIcsFile(show: Show, dateStr?: string): void {

  const chosenDate = dateStr || show.dates[0];
  if (!chosenDate) return;

  const dateCompact = chosenDate.replace(/-/g, '');
  let startTime = '210000';
  let endTime = '233000';
  const timeMatch = show.time.match(/([0-9]{1,2}):?([0-9]{2})?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const mins = timeMatch[2] || '00';
    startTime = `${hours}${mins}00`;
    const endHour = String((Number(hours) + 3) % 24).padStart(2, '0');
    endTime = `${endHour}${mins}00`;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MDQSHOW//Recitales Mar del Plata//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:mdqshow-${show.id}-${dateCompact}@mdqshow.com.ar`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dateCompact}T${startTime}`,
    `DTEND:${dateCompact}T${endTime}`,
    `SUMMARY:${show.band} en Mar del Plata`,
    `DESCRIPTION:Show de ${show.band} en ${show.venue}. Entradas: ${show.ticketUrl}`,
    `LOCATION:${show.venue}, ${show.venueAddress}, Mar del Plata`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${show.band.toLowerCase().replace(/[^a-z0-9]/g, '_')}_mdqshow.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
