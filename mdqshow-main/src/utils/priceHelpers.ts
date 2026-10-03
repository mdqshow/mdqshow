/**
 * Utilidades para formatear precios en moneda argentina ($ con separador de miles '.')
 */

/**
 * Normaliza cualquier entrada de precio escrita por el usuario a un formato uniforme.
 * Ejemplos:
 *  "80000"      -> "$ 80.000"
 *  "80.000"     -> "$ 80.000"
 *  "$ 80000"    -> "$ 80.000"
 *  "$80.000"    -> "$ 80.000"
 *  "gratis"     -> "Entrada gratuita"
 *  "libre"      -> "Entrada libre y gratuita"
 *  "80000 - 120000" -> "$ 80.000 - $ 120.000"
 */
export function normalizePriceInput(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower.includes('gratis') || lower.includes('libre')) {
    return 'Entrada gratuita';
  }

  // Si contiene un guión o rango (ej: 80000 - 120000)
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    const formattedParts = parts.map((part) => {
      const clean = part.replace(/[^0-9]/g, '');
      if (!clean) return part.trim();
      const num = parseInt(clean, 10);
      return isNaN(num) ? part.trim() : `$ ${num.toLocaleString('es-AR')}`;
    });
    return formattedParts.join(' - ');
  }

  // Extraer todos los dígitos numéricos
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    // Si escribió texto como "A confirmar" o similar, lo devolvemos limpio
    return trimmed;
  }

  const num = parseInt(digitsOnly, 10);
  if (isNaN(num)) {
    return trimmed;
  }

  // Formato estándar argentino: $ 80.000
  return `$ ${num.toLocaleString('es-AR')}`;
}

/**
 * Devuelve el texto amigable para mostrar en las tarjetas de recitales
 * Ejemplo: "Entradas desde $ 80.000" o "Entrada gratuita"
 */
export function formatDisplayPrice(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower.includes('gratis') || lower.includes('libre')) {
    return 'Entrada gratuita';
  }

  // Extraer el primer monto numérico significativo
  // Maneja tanto "80000" como "80.000" o "$80.000"
  const digitsOnly = trimmed.replace(/\./g, '').match(/\d+/);
  if (digitsOnly && digitsOnly[0]) {
    const num = parseInt(digitsOnly[0], 10);
    if (!isNaN(num)) {
      return `Entradas desde $ ${num.toLocaleString('es-AR')}`;
    }
  }

  return `Entradas: ${trimmed}`;
}
