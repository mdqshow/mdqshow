import { Subscriber } from '../services/subscribersService';

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function formatSubscriberDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-AR', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Prepara un valor para CSV: comillas bien escapadas y protección contra fórmulas de Excel (=, +, -, @) */
function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[";\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * Arma el CSV. Usa punto y coma como separador porque es lo que Excel espera en español (Argentina).
 * La columna "Estado" indica si cada suscriptor era NUEVO o ya se había descargado antes.
 */
export function buildSubscribersCsv(subscribers: Subscriber[]): string {
  const header = ['Email', 'Fecha de alta', 'Alertas inmediatas', 'Resumen semanal', 'Género favorito', 'Estado', 'Descargado antes el'];
  const rows = subscribers.map((s) => [
    s.email,
    formatSubscriberDate(s.subscribedAt),
    s.instantAlerts ? 'Sí' : 'No',
    s.weeklyDigest ? 'Sí' : 'No',
    s.favoriteGenre || '—',
    s.exportedAt ? 'Ya descargado' : 'NUEVO',
    s.exportedAt ? formatSubscriberDate(s.exportedAt) : '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}

/** Descarga el archivo CSV (con BOM para que Excel respete las tildes) */
export function downloadSubscribersCsv(subscribers: Subscriber[], kind: 'nuevos' | 'todos'): void {
  const blob = new Blob(['\uFEFF' + buildSubscribersCsv(subscribers)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `suscriptores-mdqshow-${kind.toUpperCase()}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
