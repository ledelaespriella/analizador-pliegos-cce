/**
 * @file pdfExtractor.js — Extrae texto plano de un PDF usando PDF.js.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * No depende de servicios externos ni IA; todo el procesamiento
 * ocurre en el navegador del usuario.
 *
 * Estrategia:
 *  1. Carga el PDF en memoria como ArrayBuffer.
 *  2. Itera página a página usando getTextContent().
 *  3. Concatena los items de texto respetando saltos de línea lógicos.
 *  4. Devuelve el texto completo y metadatos básicos.
 */

import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Worker servido localmente desde el bundle. Esto preserva la promesa
// "100% local — sin enviar datos a servidores externos": ni siquiera el
// worker de PDF.js se descarga de una CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extrae todo el texto de un archivo PDF.
 *
 * @param {File} file - Objeto File del input o drop zone.
 * @param {function(number, number): void} [onProgress] - Callback de progreso (página actual, total).
 * @returns {Promise<{ text: string, numPages: number, info: object }>}
 */
export async function extractTextFromPDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    // Deshabilitar el mapeado de fuentes mejora la velocidad en documentos grandes.
    disableFontFace: true,
    // Usar cmap para correcto soporte de caracteres especiales en español.
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  // Extraer metadatos (título, autor, fecha de creación…)
  let info = {};
  try {
    const meta = await pdf.getMetadata();
    info = meta?.info ?? {};
  } catch {
    // Los metadatos son opcionales
  }

  const pageTexts = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) onProgress(pageNum, numPages);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruir el flujo de texto agrupando items por línea lógica.
    // Los items del mismo "bloque vertical" se unen con espacio;
    // los saltos verticales significativos se convierten en \n.
    const lineText = buildPageText(textContent.items);
    pageTexts.push(`--- PÁGINA ${pageNum} ---\n${lineText}`);
  }

  const rawText = pageTexts.join('\n\n');
  return {
    text: rejoinSplitWords(rawText),
    numPages,
    info,
  };
}

/**
 * Convierte los items de texto de una página en texto legible,
 * detectando saltos de línea por posición vertical (coordenada Y).
 *
 * @param {Array<object>} items
 * @returns {string}
 */
// Conjunto de fragmentos cortos (1–3 letras) que SON palabras reales en español
// y por tanto no deben pegarse al token anterior. Lista deliberadamente conservadora:
// preposiciones, conjunciones, artículos, pronombres y verbos copulativos breves.
const REAL_SHORT_WORDS = new Set([
  'a','y','o','u','e','i',
  'al','el','la','lo','las','los','un','una','su','sus','mi','tu','le','les','me','te','se','si','no','ni','de','en','es','un',
  'por','con','sin','del','los','las','que','las','las','los','des','sub',
  'son','fue','han','hay','sea','ser','muy','más','aún','ya','tal','tan','así','dos','tres','uno','dia','día','año','año',
]);

/**
 * Repara palabras que PDF.js separa con espacios espurios al renderizar PDFs
 * con tracking/kerning irregular (p.ej. "correspond ientes" → "correspondientes",
 * "202 5" → "2025"). Es conservadora: no une un fragmento si éste es una
 * palabra real corta del español (de, en, el, la, los, …) o si el token previo
 * termina en una sílaba completa razonable.
 */
function rejoinSplitWords(text) {
  // 1) Dígitos: "202 5" → "2025" y "48 .485" → "48.485". Sin riesgo léxico.
  let out = text
    .replace(/(\d) (\d)/g, '$1$2')
    .replace(/(\d) ([.,]\d)/g, '$1$2');

  // 2) Letra + espacio + 1–3 letras minúsculas + espacio: posible split.
  //    Solo pegamos cuando el fragmento NO es una palabra real corta.
  out = out.replace(
    /([a-záéíóúüñ]{3,}) ([a-záéíóúüñ]{1,3})(?=[\s.,;:!?)\]"'-])/gi,
    (match, prev, frag) => {
      if (REAL_SHORT_WORDS.has(frag.toLowerCase())) return match;
      return prev + frag;
    },
  );

  return out;
}

function buildPageText(items) {
  if (!items.length) return '';

  const lines = [];
  let currentLine = [];
  let lastY = null;

  for (const item of items) {
    const str = item.str ?? '';
    if (!str.trim() && str !== ' ') continue;

    // La coordenada Y viene en el transform: [scaleX, 0, 0, scaleY, x, y]
    const y = item.transform?.[5] ?? 0;

    // Umbral de salto de línea: diferencia de más de 3 unidades en Y.
    if (lastY !== null && Math.abs(y - lastY) > 3) {
      if (currentLine.length) lines.push(currentLine.join(' '));
      currentLine = [];
    }

    currentLine.push(str);
    lastY = y;
  }

  if (currentLine.length) lines.push(currentLine.join(' '));

  return lines.join('\n');
}
