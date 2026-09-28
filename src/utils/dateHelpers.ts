import { Show } from '../types';

export function formatSingleDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function formatFullDates(dates: string[]): string {
  if (!dates || dates.length === 0) return 'Fecha a confirmar';
  
  if (dates.length === 1) {
    const [y, m, d] = dates[0].split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Multiple dates
  const formattedDates = dates.map(d => {
    const [year, month, day] = d.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  });

  return formattedDates.join(' • ');
}

export function getDaysUntil(dateStr?: string): { days: number; text: string; isPast: boolean } {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
    return { days: 999, text: 'Fecha a confirmar', isPast: false };
  }
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return { days: 999, text: 'Fecha a confirmar', isPast: false };
    }
    const target = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isNaN(diffDays)) {
      return { days: 999, text: 'Fecha a confirmar', isPast: false };
    }
    if (diffDays < 0) {
      return { days: diffDays, text: 'Ya realizado', isPast: true };
    }
    if (diffDays === 0) {
      return { days: 0, text: '¡Toca hoy!', isPast: false };
    }
    if (diffDays === 1) {
      return { days: 1, text: '¡Mañana!', isPast: false };
    }
    return { days: diffDays, text: `Faltan ${diffDays} días`, isPast: false };
  } catch {
    return { days: 999, text: 'Próximamente', isPast: false };
  }
}

export function getEarliestDate(dates: string[]): string {
  if (!dates || dates.length === 0) return '';
  return [...dates].sort()[0];
}

/**
 * Returns true if ALL dates of a show have already passed (event is completed)
 */
export function isShowPast(dates?: string[]): boolean {
  if (!dates || dates.length === 0) return false;
  return dates.every(d => getDaysUntil(d).isPast);
}

export function getGoogleCalendarUrl(show: Show, selectedDate?: string): string {
  const dateToUse = selectedDate || getEarliestDate(show.dates);
  if (!dateToUse) return '#';
  
  const cleanDate = dateToUse.replace(/-/g, '');
  const startTime = `${cleanDate}T230000Z`;
  const endTime = `${cleanDate}T235959Z`;

  const title = encodeURIComponent(`${show.band} - ${show.tourName}`);
  const details = encodeURIComponent(
    `${show.description}\n\nLugar: ${show.venue} (${show.venueAddress}, ${show.city})\nHorario: ${show.time}\nEntradas: ${show.ticketUrl}`
  );
  const location = encodeURIComponent(`${show.venue}, ${show.venueAddress}, ${show.city}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
}

export function getWhatsAppShareUrl(show: Show): string {
  const firstDate = formatFullDates(show.dates);
  const text = encodeURIComponent(
    `🎸 ¡Mira este show!\n*${show.band}* - ${show.tourName}\n📅 ${firstDate} (${show.time})\n📍 ${show.venue} (${show.city})\n🎟️ Entradas en ${show.ticketPortalName}: ${show.ticketUrl}`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}
