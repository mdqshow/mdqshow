import { Sponsor } from '../types';

const TYPE_LABELS: Record<string, string> = {
  text: 'Solo texto',
  image: 'Imagen / banner gráfico',
  video: 'Video',
};

const EFFECT_LABELS: Record<string, string> = {
  random: 'Al azar',
  bruto: 'Bruto',
  'abbey-road': 'Abbey Road',
  bendu: 'Bendu Arena',
  'arena-mdp': 'Arena Mar del Plata',
  'plaza-musica': 'Plaza de la Música',
  mute: 'Mute',
  'radio-city': 'Teatro Radio City',
  'cyber-neon': 'Cyber Neón',
  'golden-shimmer': 'Golden Shimmer',
  'retro-bounce': 'Retro Bounce',
  'float-glow': 'Float Glow',
};

function describeMedia(value?: string, emptyLabel = '—'): string {
  if (!value) return emptyLabel;
  // Las imágenes subidas desde el panel se guardan como datos embebidos: no se vuelcan al TXT
  if (value.startsWith('data:')) return '(imagen subida desde el panel; no se incluye en este archivo)';
  return value;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Arma el texto del respaldo con toda la información de cada sponsor */
export function buildSponsorsTxt(sponsors: Sponsor[]): string {
  const sorted = [...sponsors].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  const active = sorted.filter((s) => s.isActive !== false).length;
  const now = new Date().toLocaleString('es-AR');

  const lines: string[] = [];
  lines.push('MDQSHOW - RESPALDO DE SPONSORS');
  lines.push('================================');
  lines.push(`Generado: ${now}`);
  lines.push(`Total: ${sorted.length}  |  Operativos: ${active}  |  Pausados: ${sorted.length - active}`);
  lines.push('');

  sorted.forEach((s, i) => {
    const places: string[] = [];
    if (s.showInPopup) places.push('Pop-up de inicio');
    if (s.showInTopBanner) places.push('Los dos primeros');
    if (s.showInFeed !== false) places.push('Resto de la página');

    lines.push('--------------------------------');
    lines.push(`${i + 1}. ${s.name}`);
    lines.push(`   Renglón 2 (dirección o bajada): ${s.address || '—'}`);
    lines.push(`   Estado: ${s.isActive !== false ? 'Operativo' : 'Pausado'}`);
    lines.push(`   Tipo: ${TYPE_LABELS[s.type] || s.type}`);
    lines.push(`   Enlace de destino: ${s.link || '—'}`);
    lines.push(`   Se muestra en: ${places.length ? places.join(', ') : 'En ningún lugar'}`);
    if (s.type === 'text') {
      lines.push(`   Efecto: ${EFFECT_LABELS[s.effectType || 'random'] || s.effectType}`);
      lines.push(`   Colores: fondo ${s.bgColor || '—'} | texto ${s.textColor || '—'} | renglón 2 ${s.subtextColor || '—'}`);
    }
    if (s.type === 'image' || s.image) lines.push(`   Imagen: ${describeMedia(s.image)}`);
    if (s.type === 'video') lines.push(`   Video: ${describeMedia(s.video)}`);
    lines.push(`   Notas: ${s.notes || '—'}`);
    lines.push(`   Fecha de alta: ${formatDate(s.createdAt)}`);
    lines.push(`   ID interno: ${s.id}`);
    lines.push('');
  });

  return lines.join('\r\n');
}

/** Descarga el respaldo como archivo .txt (con BOM para que Windows muestre bien las tildes) */
export function downloadSponsorsTxt(sponsors: Sponsor[]): void {
  const text = '\uFEFF' + buildSponsorsTxt(sponsors);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `sponsors-mdqshow-${stamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
