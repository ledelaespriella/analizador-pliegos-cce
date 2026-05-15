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

// Apunta el worker al CDN de PDF.js para evitar problemas de bundling.
// Se puede cambiar a un worker local si se prefiere modo offline:
//   import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
//   pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
/**
 * Repara palabras que PDF.js separa con espacios espurios
 * (e.g. "correspond ientes" → "correspondientes", "202 5" → "2025").
 */
function rejoinSplitWords(text) {
  return text
    // Letra + espacio + letra minúscula dentro de una palabra: "correspond ientes" → "correspondientes"
    .replace(/([a-záéíóúüñ]) ([a-záéíóúüñ]{1,3}) /gi, (m, a, b) => {
      // Only rejoin if the fragment is ≤3 chars (likely a split, not two real words)
      return a + b + ' ';
    })
    // Dígitos separados por espacio: "202 5" → "2025", "48 .485" → "48.485"
    .replace(/(\d) (\d)/g, '$1$2')
    // Número + espacio + punto/coma + dígitos: "48 .485" → "48.485"
    .replace(/(\d) ([.,]\d)/g, '$1$2')
    // Letras espaciadas tipo header: "P á g i n a" queda tal cual (demasiado corto cada fragmento)
    // "d u r ac i ón" → intentar rejoin de letras sueltas separadas por espacios
    .replace(/\b([a-záéíóúüñ]) ([a-záéíóúüñ]) ([a-záéíóúüñ]) /gi, '$1$2$3 ')
    .replace(/\b([a-záéíóúüñ]) ([a-záéíóúüñ]) /gi, '$1$2 ');
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
