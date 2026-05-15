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

// ─── PATRONES ────────────────────────────────────────────────────────────────

const RE_PROCESO = [
  /N[UÚ]MERO\s+(?:DEL\s+)?PROCESO[:\s]+([A-Z]{1,10}[-–][A-Z0-9\-–]{3,30})/i,
  /PROCESO\s+No\.?\s*[:\-]?\s*([A-Z]{1,10}[-–][A-Z0-9\-–]{3,30})/i,
  /\b((?:LP|SA|MC|CD|PA|SASI|LOP|SOP|SA-SBC|SA-SLPC|CCNM|MIC)[-–][A-Z0-9\-–]{3,25})\b/i,
];

const RE_OBJETO_MULTILINE = [
  /"\s*OBJETO\s*:\s*([^"]{20,500})"/i,
  /OBJETO\s*:\s*MEJORA[^\n"]*(?:\n[^\n"]{10,200})*?(?=\s*[".])/i,
];

const RE_OBJETO = [
  /2\.\d\.?\s*OBJETO\s*:\s*\n[^\n]*(?:OBJETO\s*:\s*)?([A-ZÁÉÍÓÚÑ][^\n]{20,300})/i,
  /OBJETO\s*:\s*((?:MEJORA|CONSTRUCC|ADECUAC|REHABILIT|MANTEN|SUMINISTR|PRESTAC)[^\n]{15,300})/i,
  /OBJETO(?:\s+DEL\s+(?:CONTRATO|PROCESO))?[:\s]+((?:MEJORA|CONSTRUCC|ADECUAC|REHABILIT|MANTEN|SUMINISTR|PRESTAC)[^\n]{15,300})/i,
  /(?:el\s*"\s*OBJETO\s*:\s*)((?:MEJORA|CONSTRUCC)[A-ZÁÉÍÓÚÑ\s/,]+(?:DEL\s+MUNICIPIO\s+DE\s+[A-ZÁÉÍÓÚ]+)?)/i,
];

const RE_ENTIDAD = [
  /ENTIDAD\s+CONTRATANTE\s*:\s*([^\n]{5,100})/i,
  /(?:procede\s+el\s+)((?:municipio|departamento|instituto|agencia)\s+de\s+[A-ZÁÉÍÓÚa-záéíóú]+)/i,
  /(?:MUNICIPIO\s+DE\s+)([A-ZÁÉÍÓÚ]{3,30})(?:\s+(?:procede|a\s+elaborar|se\s+vio))/i,
];

const RE_NIT = [
  /NIT[:\s.No]+([0-9.]{6,15}[-–]?[0-9])/i,
];

const RE_DEPENDENCIA = [
  /[Dd]ependencia\s+solicitante[:\s]+([^\n]{5,120})/i,
  /DEPENDENCIA[:\s]+([^\n]{5,120})/i,
  /UNIDAD\s+EJECUTORA[:\s]+([^\n]{5,120})/i,
];

const RE_TIPO_CONTRATO = [
  /[Tt]ipo\s+de\s+contrato[:\s]+([A-ZÁÉÍÓÚ][^\n]{2,60})/i,
  /NATURALEZA\s+(?:DEL\s+CONTRATO)?[:\s]+([^\n]{5,80})/i,
  /(OBRA\s+P[UÚ]BLICA|SUMINISTRO|PRESTACI[OÓ]N\s+DE\s+SERVICIOS|CONSULTORI?A|INTERVENTORI?A)/i,
];

const RE_MODALIDAD = [
  /(?:modalidad\s+de\s+selecci[oó]n\s+(?:es|ser[aá])[:\s]*)((?:Licitaci[oó]n|Selecci[oó]n|Concurso|Contrataci[oó]n|M[ií]nima)\s+[A-Za-záéíóúÁÉÍÓÚ]+)/i,
  /MODALIDAD\s+DE\s+SELECCI[OÓ]N[:\s]+((?:Licitaci[oó]n|Selecci[oó]n|Concurso|Contrataci[oó]n|M[ií]nima)[^\n,;]{3,50})/i,
  /PLIEGOS?\s+TIPO\s+(LICITACI[OÓ]N\s+DE\s+OBRA\s+P[UÚ]BLICA)/i,
];

const RE_PRESUPUESTO = [
  /\(\$\s*([\d.,]{10,30})\)\s*(?:INCLUIDO|IVA|M\/CTE)/i,
  /\(\$\s*([\d.,]{10,30})\)/i,
  /PRESUPUESTO\s+OFICIAL[^]*?\(\$\s*([\d.,]{10,30})\)/i,
  /PRESUPUESTO\s+OFICIAL[^$]*?\$\s*([\d.,]{10,30})/i,
  /VALOR\s+(?:M[AÁ]XIMO|DEL\s+CONTRATO|ESTIMADO)[^$]*?\$\s*([\d.,]{10,30})/i,
];

const RE_ANTICIPO = [
  /(?:anticipo\s+un\s+valor\s+equivalente\s+al\s+)(\d{1,2}(?:[.,]\d+)?\s*%\s*del\s+valor\s+[a-záéíóú]+\s+del\s+contrato)/i,
  /(?:anticipo[^\n]*?)(\d{1,2}(?:[.,]\d+)?\s*%)/i,
];

const RE_FORMA_PAGO = [
  /Forma\s+de\s+Pago[:\s]+\n((?:La\s+Entidad|El\s+pago|Se\s+realizar[aá]n?)[^\n]{10,300})/i,
  /(?:cancelar[aá]|pagar[aá]|efectuar[aá])\s+al\s+[Cc]ontratista\s+([^\n]{10,200})/i,
  /CONDICIONES?\s+DE\s+PAGO[:\s]+([^\n]{5,200})/i,
];

const RE_PLAZO = [
  /(?:ser[aá]\s+de\s+)([A-ZÁÉÍÓÚ]+\s*\(\d+\)\s*MESES?\b[^\n]{0,80})/i,
  /PLAZO[^\n]*?(\d+)\s*\)?\s*MESES?\s+de\s+\d+\s+d[ií]as/i,
  /(?:DIECIOCHO|VEINTICUATRO|DOCE|TREINTA|QUINCE|VEINTE|SEIS|OCHO|NUEVE|DIEZ)\s*\((\d+)\)\s*MESES/i,
  /PLAZO\s+(?:DE\s+)?EJECUCI[OÓ]N[:\s]+(\d+\s*(?:MESES?|D[IÍ]AS?))/i,
  /(\d+)\s*(?:\)\s*)?MESES?\s+(?:de\s+30\s+d[ií]as|a\s+partir|contados?)/i,
];

const RE_LUGAR = [
  /(?:lugar\s+de\s+ejecuci[oó]n\s+del\s+contrato\s+(?:est[aá][^\n]*?))(MUNICIPIO\s+DE\s+[A-ZÁÉÍÓÚ]+)/i,
  /(?:localiza(?:ci[oó]n|da)\s+(?:es\s+)?en\s+)([A-ZÁÉÍÓÚa-záéíóú][^\n,]{3,60})/i,
  /LUGAR\s+(?:DE\s+)?EJECUCI[OÓ]N[:\s]+(?:del\s+contrato\s+)?([^\n]{5,80})/i,
];

const RE_AIU = [
  /AIU\s+no\s+podr[aá]\s+exceder[^\n]*?(\d{1,2})\s*(?:por\s+ciento\s*\(\s*\d+\s*%?\s*\)|\s*%)/i,
  /(?:treinta|veinte|veinticinco|quince)\s+por\s+ciento\s*\((\d{1,2})\s*%?\s*\)/i,
  /AIU\s+(?:M[AÁ]XIMO)?[:\s]+(\d{1,2}(?:[.,]\d+)?\s*%)/i,
  /A\.I\.U\.?\s*(?:M[AÁ]XIMO)?[:\s]+(\d{1,2}(?:[.,]\d+)?\s*%)/i,
];

const RE_FECHA = [
  /[Ff]echa\s+de\s+elaboraci[oó]n\s+de\s+los\s+estudios\s+previos[:\s]+([^\n]{4,40})/i,
  /FECHA\s+(?:DE\s+)?ELABORACI[OÓ]N[:\s]+([^\n]{4,40})/i,
  /(?:CIUDAD\s+Y\s+FECHA|BOGOT[AÁ]\s*,\s*D\.C\.)[,\s]+(\d{1,2}\s+DE\s+\w+\s+DE\s+\d{4})/i,
];

const RE_COMPLEJIDAD = [
  /(?:proyecto\s+se\s+considera\s+de\s+)(ALTA|MEDIA|BAJA)\s+COMPLEJIDAD/i,
  /(ALTA)\s+COMPLEJIDAD\s*:/i,
  /COMPLEJIDAD[:\s]+(ALTA|MEDIA|BAJA)/i,
  /NIVEL\s+DE\s+COMPLEJIDAD[:\s]+(ALTA|MEDIA|BAJA)/i,
];

const RE_UNSPSC = /\b(\d{8})\b\s+([A-Za-záéíóúÁÉÍÓÚñÑ][^\n]{4,80})/g;

// ─── EXPORTADO ───────────────────────────────────────────────────────────────

export function extractResumen(text) {
  // Extraer códigos UNSPSC (8 dígitos seguidos de descripción con letra inicial)
  const unspscCodes = [];
  let m;
  RE_UNSPSC.lastIndex = 0;
  while ((m = RE_UNSPSC.exec(text)) !== null) {
    const code = m[1];
    const desc = m[2]?.trim().replace(/\s+/g, ' ');
    const entry = `${code} - ${desc}`;
    if (!unspscCodes.some(e => e.startsWith(code))) unspscCodes.push(entry);
  }

  // Presupuesto — extract first, used for complejidad inference
  const presupuesto = first(text, RE_PRESUPUESTO);

  // Complejidad
  let complejidad = first(text, RE_COMPLEJIDAD);
  if (!complejidad && presupuesto) {
    const presNum = parseMoneyString(presupuesto);
    if (presNum !== null) {
      if (presNum >= 5e9)       complejidad = 'Alta';
      else if (presNum >= 1e9)  complejidad = 'Media';
      else                      complejidad = 'Baja';
    }
  }

  // Objeto — try multi-line extraction first for "OBJETO: MEJORAMIENTO...DEL CESAR"
  let objeto = null;
  for (const re of RE_OBJETO_MULTILINE) {
    re.lastIndex = 0;
    const om = re.exec(text);
    if (om) {
      objeto = (om[1] ?? om[0]).replace(/\s+/g, ' ').trim();
      break;
    }
  }
  if (!objeto) objeto = first(text, RE_OBJETO);
  if (objeto) {
    objeto = objeto
      .replace(/^"?\s*OBJETO\s*:\s*/i, '')
      .replace(/[""\s.]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // AIU — extract numeric percentage
  let aiu = first(text, RE_AIU);
  if (aiu) {
    const pctMatch = /(\d{1,2})\s*%?/.exec(aiu);
    if (pctMatch) aiu = `${pctMatch[1]}%`;
  }

  // Modalidad — detect from document title if not explicit
  let modalidad = first(text, RE_MODALIDAD);
  if (!modalidad && /PLIEGOS?\s+TIPO\s+LICITACI[OÓ]N/i.test(text)) {
    modalidad = 'Licitación Pública';
  }
  if (modalidad) {
    modalidad = modalidad.replace(/\s+/g, ' ').trim();
  }

  // Entidad — prefer "procede el municipio de X" over generic MUNICIPIO DE X
  const entidad = first(text, RE_ENTIDAD);

  // Plazo — try to get the full text like "DIECIOCHO (18) MESES de 30 días..."
  let plazo = first(text, RE_PLAZO);
  if (plazo) {
    // If we only got a number, try to enhance
    const numOnly = /^(\d+)$/.exec(plazo);
    if (numOnly) plazo = `${numOnly[1]} meses`;
    plazo = plazo.replace(/\s+/g, ' ').trim();
  }

  // Lugar
  let lugar = first(text, RE_LUGAR);
  if (lugar) {
    lugar = lugar.replace(/\s+/g, ' ').trim();
  }

  // Forma de pago
  let formaPago = first(text, RE_FORMA_PAGO);
  if (formaPago) {
    formaPago = formaPago.replace(/\s+/g, ' ').trim();
  }

  return {
    proceso:       first(text, RE_PROCESO)     ?? NIL,
    objeto:        objeto                      ?? NIL,
    entidad:       entidad                     ?? NIL,
    nit:           first(text, RE_NIT)         ?? NIL,
    dependencia:   first(text, RE_DEPENDENCIA) ?? NIL,
    tipoContrato:  first(text, RE_TIPO_CONTRATO) ?? NIL,
    modalidad:     modalidad                   ?? NIL,
    presupuesto:   presupuesto                 ?? NIL,
    anticipo:      first(text, RE_ANTICIPO)    ?? NIL,
    formaPago:     formaPago                   ?? NIL,
    plazo:         plazo                       ?? NIL,
    lugar:         lugar                       ?? NIL,
    aiu:           aiu                         ?? NIL,
    complejidad:   complejidad                 ?? NIL,
    fechaEstudios: first(text, RE_FECHA)       ?? NIL,
    unspsc:        unspscCodes.length ? unspscCodes : [],
  };
}
