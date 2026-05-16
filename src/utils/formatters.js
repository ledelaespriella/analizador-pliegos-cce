/**
 * @file formatters.js — Utilidades de formateo para valores monetarios, fechas y texto.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */

/**
 * Formatea un valor numérico o string a notación monetaria COP legible.
 * Acepta tanto valores numéricos como cadenas en formato colombiano
 * (1.500.000.000) o anglosajón (1,500,000,000).
 * @param {string|number} value
 * @returns {string}
 */
export function fmtCOP(value) {
  if (value === null || value === undefined || value === '' ||
      value === 'No especificado en el pliego') return '—';

  const n = typeof value === 'number' ? value : parseMoneyString(String(value));
  if (n === null || isNaN(n)) return String(value);

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
 * Maneja formatos: 1.500.000.000 / 1,500,000,000 / 1.500.000,75 / 1,500.75
 * @param {string} raw
 * @returns {number|null}
 */
export function parseMoneyString(raw) {
  if (raw === null || raw === undefined) return null;
  // Elimina todo excepto dígitos y separadores
  const clean = String(raw).replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  if (!clean || !/\d/.test(clean)) return null;

  const lastComma = clean.lastIndexOf(',');
  const lastDot   = clean.lastIndexOf('.');

  // Si conviven ambos separadores → el último es el decimal, el otro es miles.
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // Formato colombiano/europeo: 1.500.000,75
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }
    // Formato anglosajón: 1,500,000.75
    return parseFloat(clean.replace(/,/g, ''));
  }

  // Solo un tipo de separador o ninguno.
  if (lastComma === -1 && lastDot === -1) return parseFloat(clean);

  const sep = lastComma !== -1 ? ',' : '.';
  const parts = clean.split(sep);

  // Si hay un único separador con 1 o 2 dígitos a la derecha → decimal.
  // Si hay 3 dígitos a la derecha → más probable separador de miles.
  if (parts.length === 2 && parts[1].length <= 2) {
    return parseFloat(parts.join('.'));
  }
  return parseFloat(clean.split(sep).join(''));
}
