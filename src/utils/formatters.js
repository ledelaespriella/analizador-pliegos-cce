/**
 * Utilidades de formateo para valores monetarios, fechas y texto.
 */

/**
 * Formatea un valor numérico o string a notación monetaria COP legible.
 * @param {string|number} value
 * @returns {string}
 */
export function fmtCOP(value) {
  if (!value || value === 'No especificado en el pliego') return '—';
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return String(value);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} MM COP`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M COP`;
  if (n >= 1e3) return `$${n.toLocaleString('es-CO')} COP`;
  return String(value);
}

/**
 * Capitaliza la primera letra de cada oración.
 * @param {string} text
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Trunca un texto largo dejando un máximo de caracteres.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max = 120) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

/**
 * Limpia texto extraído de PDF: normaliza espacios y saltos de línea.
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normaliza una cantidad monetaria extraída con regex a número.
 * Maneja formatos: 1.500.000.000 / 1,500,000,000 / 1500000000
 * @param {string} raw
 * @returns {number|null}
 */
export function parseMoneyString(raw) {
  if (!raw) return null;
  // Elimina todo excepto dígitos y separadores
  const clean = raw.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  if (!clean) return null;

  // Si el último separador es coma → formato europeo/colombiano (1.500.000,00)
  const lastComma = clean.lastIndexOf(',');
  const lastDot   = clean.lastIndexOf('.');
  if (lastComma > lastDot) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  // Si el último separador es punto con exactamente 2 decimales → decimal
  if (lastDot !== -1 && clean.length - lastDot === 3 && lastComma === -1) {
    return parseFloat(clean.replace(/,/g, ''));
  }
  // Asumir separador de miles con punto
  return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
}
