/**
 * @file resumen.js — Extrae los datos generales del proceso del pliego.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Aplica multiples patrones regex en orden de especificidad descendente;
 * el primero que encuentre resultado gana.
 */

import { parseMoneyString } from '../../utils/formatters.js';

const NIL = 'No especificado en el pliego';

/** Busca el primer match de una lista de regex en el texto. */
function first(text, patterns) {
  for (const re of patterns) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) return m[1]?.trim() ?? m[0]?.trim() ?? null;
  }
  return null;
}

/** Busca todos los matches únicos de una regex. */
function all(text, re) {
  re.lastIndex = 0;
  const results = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const val = (m[1] ?? m[0]).trim();
    if (val && !results.includes(val)) results.push(val);
  }
  return results;
}

// ─── PATRONES ────────────────────────────────────────────────────────────────

const RE_PROCESO = [
  /N[UÚ]MERO\s+(?:DEL\s+)?PROCESO[:\s]+([A-Z]{1,5}[-–][A-Z0-9\-–]{3,30})/i,
  /PROCESO\s+No\.?\s*[:\-]?\s*([A-Z]{1,5}[-–][A-Z0-9\-–]{3,30})/i,
  /\b((?:LP|SA|MC|CD|PA|SASI|SA-SBC|SA-SLPC|CCNM)[-–][A-Z0-9\-–]{3,25})\b/i,
];

const RE_OBJETO = [
  /OBJETO(?:\s+DEL\s+CONTRATO)?[:\s]+([^\n]{20,300})/i,
  /(?:OBJETO\s*:|SE\s+REQUIERE\s+CONTRATAR\s*:?)\s*([^\n]{20,300})/i,
];

const RE_ENTIDAD = [
  /ENTIDAD\s+(?:CONTRATANTE|ESTATAL)[:\s]+([^\n]{5,100})/i,
  /CONTRATANTE[:\s]+([^\n]{5,100})/i,
  /(?:DEPARTAMENTO|MUNICIPIO|INSTITUTO|AGENCIA|MINISTERIO)\s+(?:DE\s+)?([^\n]{5,80})/i,
];

const RE_NIT = [
  /NIT[:\s.No]+([0-9.]{6,15}[-–]?[0-9])/i,
];

const RE_DEPENDENCIA = [
  /DEPENDENCIA[:\s]+([^\n]{5,120})/i,
  /UNIDAD\s+EJECUTORA[:\s]+([^\n]{5,120})/i,
  /SOLICITANTE[:\s]+([^\n]{5,120})/i,
];

const RE_TIPO_CONTRATO = [
  /TIPO\s+DE\s+CONTRATO[:\s]+([^\n]{5,80})/i,
  /NATURALEZA\s+(?:DEL\s+CONTRATO)?[:\s]+([^\n]{5,80})/i,
  /(OBRA\s+P[UÚ]BLICA|SUMINISTRO|PRESTACI[OÓ]N\s+DE\s+SERVICIOS|CONSULTORI?A|INTERVENTORI?A)/i,
];

const RE_MODALIDAD = [
  /MODALIDAD\s+DE\s+SELECCI[OÓ]N[:\s]+([^\n]{5,80})/i,
  /(LICITACI[OÓ]N\s+P[UÚ]BLICA|SELECCI[OÓ]N\s+ABREVIADA|CONCURSO\s+DE\s+M[EÉ]RITOS|CONTRATACI[OÓ]N\s+DIRECTA|M[IÍ]NIMA\s+CUANT[IÍ]A)/i,
];

const RE_PRESUPUESTO = [
  /PRESUPUESTO\s+OFICIAL[^$\n]*\$\s*([\d.,]+(?:\s*(?:MILLONES?|MM))?)/i,
  /VALOR\s+(?:M[AÁ]XIMO|DEL\s+CONTRATO)[^$\n]*\$\s*([\d.,]+)/i,
  /(?:VALOR\s+ESTIMADO|PRESUPUESTO)[^$\n]{0,60}\$\s*([\d.,]+)/i,
];

const RE_ANTICIPO = [
  /ANTICIPO[:\s]+([^\n]{3,80})/i,
  /(\d{1,2}(?:[.,]\d+)?\s*%)\s*(?:DE\s+)?(?:ANTICIPO|DEL\s+VALOR)/i,
];

const RE_FORMA_PAGO = [
  /FORMA\s+DE\s+PAGO[:\s]+([^\n]{5,200})/i,
  /CONDICIONES?\s+DE\s+PAGO[:\s]+([^\n]{5,200})/i,
];

const RE_PLAZO = [
  /PLAZO\s+(?:DE\s+)?EJECUCI[OÓ]N[:\s]+(\d+\s*(?:MESES?|D[IÍ]AS?\s*(?:CALENDARIO|H[AÁ]BILES?)?))/i,
  /(\d+)\s*(MESES?|D[IÍ]AS?\s*(?:CALENDARIO|H[AÁ]BILES?)?)\s+(?:A\s+PARTIR|CONTADOS?|DE\s+EJECUCI[OÓ]N)/i,
];

const RE_LUGAR = [
  /LUGAR\s+(?:DE\s+)?(?:EJECUCI[OÓ]N|ENTREGA)[:\s]+([^\n]{5,120})/i,
  /MUNICIPIO\s+DE\s+([^\n,]{3,60})/i,
];

const RE_AIU = [
  /AIU\s+(?:M[AÁ]XIMO)?[:\s]+(\d{1,2}(?:[.,]\d+)?\s*%)/i,
  /A\.I\.U\.?\s*(?:M[AÁ]XIMO)?[:\s]+(\d{1,2}(?:[.,]\d+)?\s*%)/i,
  /(?:ADMINISTRACI[OÓ]N|IMPREVISTOS|UTILIDAD)[^:\n]{0,20}(\d{1,2}(?:[.,]\d+)?\s*%)/i,
];

const RE_FECHA = [
  /(?:FECHA\s+(?:DE\s+)?ELABORACI[OÓ]N|FECHA\s+ESTUDIOS?)[:\s]+([^\n]{4,40})/i,
  /(?:CIUDAD\s+Y\s+FECHA|BOGOT[AÁ]\s*,\s*D\.C\.)[,\s]+(\d{1,2}\s+DE\s+\w+\s+DE\s+\d{4})/i,
];

const RE_COMPLEJIDAD = [
  /COMPLEJIDAD[:\s]+(ALTA|MEDIA|BAJA)/i,
  /NIVEL\s+DE\s+COMPLEJIDAD[:\s]+(ALTA|MEDIA|BAJA)/i,
];

const RE_UNSPSC = /\b(\d{8})\b[^\n]{0,60}([\w\s,áéíóúÁÉÍÓÚñÑ]{5,60})/g;

// ─── EXPORTADO ───────────────────────────────────────────────────────────────

/**
 * Extrae el bloque "resumen" del texto del pliego.
 * @param {string} text - Texto completo extraído del PDF.
 * @returns {object}
 */
export function extractResumen(text) {
  const upper = text.toUpperCase();

  // Extraer códigos UNSPSC
  const unspscCodes = [];
  let m;
  RE_UNSPSC.lastIndex = 0;
  while ((m = RE_UNSPSC.exec(text)) !== null) {
    const code = m[1];
    const desc = m[2]?.trim();
    const entry = `${code} - ${desc}`;
    if (!unspscCodes.includes(entry)) unspscCodes.push(entry);
  }

  // Inferir complejidad si no se menciona explícitamente
  let complejidad = first(text, RE_COMPLEJIDAD);
  if (!complejidad) {
    const presRaw = first(text, RE_PRESUPUESTO);
    const presNum = presRaw ? parseMoneyString(presRaw) : null;
    if (presNum !== null) {
      if (presNum >= 5e9)       complejidad = 'Alta';
      else if (presNum >= 1e9)  complejidad = 'Media';
      else                      complejidad = 'Baja';
    }
  }

  return {
    proceso:       first(text, RE_PROCESO)     ?? NIL,
    objeto:        first(text, RE_OBJETO)      ?? NIL,
    entidad:       first(text, RE_ENTIDAD)     ?? NIL,
    nit:           first(text, RE_NIT)         ?? NIL,
    dependencia:   first(text, RE_DEPENDENCIA) ?? NIL,
    tipoContrato:  first(text, RE_TIPO_CONTRATO) ?? NIL,
    modalidad:     first(text, RE_MODALIDAD)   ?? NIL,
    presupuesto:   first(text, RE_PRESUPUESTO) ?? NIL,
    anticipo:      first(text, RE_ANTICIPO)    ?? NIL,
    formaPago:     first(text, RE_FORMA_PAGO)  ?? NIL,
    plazo:         first(text, RE_PLAZO)       ?? NIL,
    lugar:         first(text, RE_LUGAR)       ?? NIL,
    aiu:           first(text, RE_AIU)         ?? NIL,
    complejidad:   complejidad                 ?? NIL,
    fechaEstudios: first(text, RE_FECHA)       ?? NIL,
    unspsc:        unspscCodes.length ? unspscCodes : [],
  };
}
