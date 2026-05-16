/**
 * @file financiero.js — Extrae indicadores financieros y capacidad residual.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Extrae indicadores financieros, capital de trabajo y capacidad residual
 * del pliego de condiciones.
 *
 * Los pliegos tipo CCE para obra publica definen:
 *  - Indices de liquidez, endeudamiento y cobertura (umbrales en Matriz 2).
 *  - Formula y valor estimado de capital de trabajo demandado (CTd).
 *  - Formula de Capacidad Residual del Proponente (CRP / CRPC).
 */

import { parseMoneyString } from '../../utils/formatters.js';

const NIL = 'No especificado en el pliego';

function extractSection(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start === -1) return '';
  const sub = text.slice(start);
  const end = sub.search(endRe);
  return end === -1 ? sub : sub.slice(0, end);
}

// ─── INDICADORES FINANCIEROS ─────────────────────────────────────────────────

const INDICATORS_DEF = [
  {
    nombre: 'Índice de Liquidez (IL)',
    formula: 'Activo Corriente / Pasivo Corriente',
    re: /(?:[ÍI]NDICE\s+DE\s+)?LIQUIDEZ/i,
    umbralRe: /(>=?\s*[\d.,]+)/,
  },
  {
    nombre: 'Índice de Endeudamiento (IE)',
    formula: 'Pasivo Total / Activo Total',
    re: /(?:NIVEL\s+DE\s+)?ENDEUDAMIENTO/i,
    umbralRe: /(<=?\s*[\d.,]+)/,
  },
  {
    nombre: 'Razón de Cobertura de Intereses (RCI)',
    formula: 'Utilidad Operacional / Gastos de Interés',
    re: /(?:RAZ[OÓ]N\s+DE\s+)?COBERTURA\s+DE\s+INTERESES/i,
    umbralRe: /(>=?\s*[\d.,]+)/,
  },
];

export function extractIndicadoresFinancieros(text) {
  const section = extractSection(text,
    /INDICADORES?\s+FINANCIEROS|3\.6\s/i,
    /CAPITAL\s+DE\s+TRABAJO|3\.7\s|CAPACIDAD\s+RESIDUAL|CAP[IÍ]TULO\s+[IVX]+\s+\d/i,
  );
  const source = section || text;

  // Detect whether thresholds reference "Matriz 2" (external)
  const matrizRef = /Matriz\s+2\s*[-–]?\s*Indicadores/i.test(source);

  const results = INDICATORS_DEF.map(def => {
    def.re.lastIndex = 0;
    const m = def.re.exec(source);
    let umbral = NIL;

    if (m) {
      const after = source.slice(m.index, m.index + 200);
      const um = def.umbralRe.exec(after);
      if (um) {
        umbral = um[1].trim();
      }
    }

    // Second pass on full text
    if (umbral === NIL) {
      def.re.lastIndex = 0;
      const m2 = def.re.exec(text);
      if (m2) {
        const after2 = text.slice(m2.index, m2.index + 200);
        const um2 = def.umbralRe.exec(after2);
        if (um2) umbral = um2[1].trim();
      }
    }

    const observacion = (umbral === NIL && matrizRef)
      ? 'Umbral definido en Matriz 2 – Indicadores financieros y organizacionales (documento anexo)'
      : '';

    return {
      indicador:   def.nombre,
      formula:     def.formula,
      umbral:      umbral === NIL && matrizRef ? 'Ver Matriz 2' : umbral,
      observacion,
    };
  });

  // Always return indicators (they exist in all CCE pliegos, even if thresholds are external)
  return results;
}

// ─── CAPITAL DE TRABAJO ───────────────────────────────────────────────────────

const RE_CT_FORMULA  = /CTd?\s*=\s*([^\n]{10,150})/i;
const RE_CT_PLAZO    = /PLAZO\s+(?:DE\s+)?EJECUCI[OÓ]N[^\n]*?(\d+)\s*(?:\)\s*)?(?:MESES?)/i;
const RE_CT_MESES    = /(?:n|N|meses\s+de\s+apalancamiento)\s*[=:>]+\s*(\d+)/i;
const RE_CT_VALOR    = /CTd?\s*(?:ESTIMADO)?[:\s>=]+\$?\s*([\d.,]+)/i;
const RE_CT_PCT      = /CTd\s*=\s*\(?\s*POE\s*[-–]\s*Anticipo[^\)]*\)\s*[x×*]\s*(\d+)\s*%/i;
const RE_PATRIMONIO  = /P\s*=\s*AT\s*-\s*PT\s*[≥>=]+\s*Pd/i;
const RE_PD_FORMULA  = /Pd\s*=\s*(?:POE|𝑃𝑂𝐸)\s*[x×*]\s*(\d+)\s*%/i;

export function extractCapitalTrabajo(text, presupuestoRaw) {
  const section = extractSection(text,
    /CAPITAL\s+DE\s+TRABAJO|3\.7\s/i,
    /PATRIMONIO|3\.8\s|CAPACIDAD\s+(?:ORGANIZACIONAL|RESIDUAL)|CAP[IÍ]TULO\s+[IVX]+\s+\d/i,
  ) || text;

  const formulaMatch = RE_CT_FORMULA.exec(section);
  const pctMatch     = RE_CT_PCT.exec(section);

  // Extract plazo from full text
  const plazoMatch = /(?:DIECIOCHO|VEINTICUATRO|DOCE|TREINTA|QUINCE|VEINTE)\s*\((\d+)\)\s*MESES/i.exec(text)
    || /PLAZO[^\n]*?(\d+)\s*(?:\)\s*)?MESES/i.exec(text)
    || RE_CT_PLAZO.exec(text);
  const plazo = plazoMatch ? parseInt(plazoMatch[1]) : null;

  // Meses de apalancamiento from table lookup
  let meses = null;
  const mesesMatch = RE_CT_MESES.exec(section);
  if (mesesMatch) {
    meses = parseInt(mesesMatch[1]);
  } else if (plazo) {
    // CCE standard table lookup
    const table = [[12,24,4],[24,36,8],[36,48,12],[48,60,16],[60,72,20],[72,84,24],[84,96,28],[96,108,32],[108,120,36]];
    const row = table.find(([min, max]) => plazo >= min && plazo < max);
    meses = row ? row[2] : (plazo < 12 ? null : 40);
  }

  const presup = presupuestoRaw ? parseMoneyString(presupuestoRaw) : null;

  // Extract anticipo percentage from text
  const antiMatch = /ANTICIPO[^\n]*?(\d{1,2})\s*%/i.exec(text);
  const anticipoPct = antiMatch ? parseInt(antiMatch[1]) / 100 : 0;

  // Calculate CTd: si el pliego trae el valor explícito → "extraido";
  // si lo derivamos del presupuesto, plazo y tabla CCE → "estimado".
  let ctdEstimado = null;
  let ctdEsEstimado = true;
  const valorMatch = RE_CT_VALOR.exec(section);
  if (valorMatch) {
    ctdEstimado = parseMoneyString(valorMatch[1]);
    if (ctdEstimado) ctdEsEstimado = false;
  }

  if (!ctdEstimado && presup) {
    if (plazo && plazo < 12 && pctMatch) {
      const pct = parseInt(pctMatch[1]) / 100;
      ctdEstimado = (presup - presup * anticipoPct) * pct;
    } else if (plazo && meses) {
      ctdEstimado = ((presup - presup * anticipoPct) / plazo) * meses;
    }
  }

  // Build formula display
  let formulaDisplay = formulaMatch?.[1]?.trim();
  if (!formulaDisplay) {
    formulaDisplay = plazo && plazo < 12
      ? 'CTd = (POE - Anticipo) × 33%'
      : 'CTd = ((POE - Anticipo) / Plazo) × n';
  }

  // Patrimonio demandado
  const pdMatch = RE_PD_FORMULA.exec(text);
  const pdPct = pdMatch ? parseInt(pdMatch[1]) / 100 : 0.25;
  const patrimonioDemandado = presup ? String(Math.round(presup * pdPct)) : NIL;

  return {
    formula:             formulaDisplay,
    plazoEjecucion:      plazo ? `${plazo} meses` : NIL,
    mesesApalancamiento: meses ?? NIL,
    ctdEstimado:         ctdEstimado ? String(Math.round(ctdEstimado)) : NIL,
    ctdEsEstimado,
    patrimonioDemandado,
    condicion:           'CT ≥ CTd',
    notas:               (pctMatch && plazo && plazo < 12) ? `Fórmula corta para plazo < 12 meses: CTd = (POE - Anticipo) × ${pctMatch[1]}%` : '',
  };
}

// ─── CAPACIDAD RESIDUAL ───────────────────────────────────────────────────────

const RE_CR_SECTION  = /CAPACIDAD\s+RESIDUAL|3\.11/i;
const RE_CR_END      = /CAP[IÍ]TULO\s+[IVX]+\s+\d|CRITERIOS?\s+DE\s+(?:EVALUACI[OÓ]N|SELECCI[OÓ]N)|4\.\s/i;
const RE_CRPC        = /CRPC?\s*[>=:]+\s*\$?\s*([\d.,]+)/i;
const RE_CRP_FORMULA = /CRP\s*=\s*([^\n]{10,200})/i;

const FACTORES_STD = [
  { factor: 'CO', nombre: 'Capacidad de Organización',  puntaje: 'Multiplicador', descripcion: 'Evalúa estructura organizacional del proponente' },
  { factor: 'E',  nombre: 'Experiencia',                puntaje: '120',           escala: '0, 40, 80, 120 según contratos acreditados' },
  { factor: 'CT', nombre: 'Capacidad Técnica',          puntaje: '40',            escala: '0, 20, 40 según equipos y personal' },
  { factor: 'CF', nombre: 'Capacidad Financiera',       puntaje: '40',            escala: '0, 20, 40 según indicadores' },
  { factor: 'SCE',nombre: 'Saldos Contratos en Ejecución', puntaje: 'Resta',     descripcion: 'Valor de contratos vigentes en ejecución' },
];

export function extractCapacidadResidual(text, presupuestoRaw) {
  const section = extractSection(text, RE_CR_SECTION, RE_CR_END) || text;

  const crpcMatch    = RE_CRPC.exec(section);
  const formulaMatch = RE_CRP_FORMULA.exec(section);

  const presup = presupuestoRaw ? parseMoneyString(presupuestoRaw) : null;
  let crpcEstimado;
  let crpcEsEstimado = false;
  if (crpcMatch) {
    crpcEstimado = parseMoneyString(crpcMatch[1])?.toString();
  } else if (presup) {
    crpcEstimado = String(Math.round(presup));
    crpcEsEstimado = true;
  } else {
    crpcEstimado = NIL;
  }

  return {
    crpcEstimado,
    crpcEsEstimado,
    formulaCRPC:  formulaMatch?.[1]?.trim() ?? 'CRP ≥ Presupuesto Oficial del Proceso',
    formulaCRP:   'CRP = CO × [(E + CT + CF) / 100] – SCE',
    factores:     FACTORES_STD,
  };
}
