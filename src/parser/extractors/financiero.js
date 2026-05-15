/**
 * financiero.js
 * -------------
 * Extrae indicadores financieros, capital de trabajo y capacidad residual
 * del pliego de condiciones.
 *
 * Los pliegos tipo CCE para obra pública definen explícitamente:
 *  - Índices de liquidez, endeudamiento y cobertura.
 *  - Fórmula y valor estimado de capital de trabajo demandado (CTd).
 *  - Fórmula de Capacidad Residual del Proponente (CRP / CRPC).
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

/** Definición de los indicadores estándar CCE y sus patrones */
const INDICATORS_DEF = [
  {
    nombre: 'Índice de Liquidez (IL)',
    formula: 'Activo Corriente / Pasivo Corriente',
    re: /(?:[ÍI]NDICE\s+DE\s+)?LIQUIDEZ[^>=<\n]{0,40}(>=?\s*[\d.,]+)/i,
    umbralRe: /(>=?\s*[\d.,]+)/,
  },
  {
    nombre: 'Índice de Endeudamiento (IE)',
    formula: 'Pasivo Total / Activo Total',
    re: /ENDEUDAMIENTO[^>=<\n]{0,40}(<=?\s*[\d.,]+)/i,
    umbralRe: /(<=?\s*[\d.,]+)/,
  },
  {
    nombre: 'Razón de Cobertura de Intereses (RCI)',
    formula: 'UAII / Gastos de Interés',
    re: /(?:RAZ[OÓ]N\s+DE\s+)?COBERTURA\s+DE\s+INTERESES[^>=<\n]{0,40}(>=?\s*[\d.,]+)/i,
    umbralRe: /(>=?\s*[\d.,]+)/,
  },
  {
    nombre: 'Patrimonio',
    formula: 'Activo Total – Pasivo Total',
    re: /PATRIMONIO[^>=<\n]{0,40}(>=?\s*[\d.,$ ]+(?:SMLMV|COP|MILLONES?)?)/i,
    umbralRe: /(>=?\s*[\d.,$ ]+(?:SMLMV|COP|MILLONES?)?)/,
  },
];

export function extractIndicadoresFinancieros(text) {
  const section = extractSection(text,
    /INDICADORES?\s+FINANCIEROS/i,
    /CAPITAL\s+DE\s+TRABAJO|CAPACIDAD\s+RESIDUAL|CAP[IÍ]TULO\s+[IVX]+\s+\d/i,
  );
  const source = section || text;

  return INDICATORS_DEF.map(def => {
    const m = def.re.exec(source);
    let umbral = NIL;
    if (m) {
      const um = def.umbralRe.exec(m[0]);
      umbral = um ? um[1].trim() : m[1]?.trim() ?? NIL;
    } else {
      // Segunda pasada sobre texto completo
      const m2 = def.re.exec(text);
      if (m2) {
        const um2 = def.umbralRe.exec(m2[0]);
        umbral = um2 ? um2[1].trim() : m2[1]?.trim() ?? NIL;
      }
    }
    return {
      indicador:   def.nombre,
      formula:     def.formula,
      umbral,
      observacion: '',
    };
  }).filter(i => i.umbral !== NIL);
}

// ─── CAPITAL DE TRABAJO ───────────────────────────────────────────────────────

const RE_CT_FORMULA  = /CTd?\s*=\s*([^\n]{10,150})/i;
const RE_CT_PLAZO    = /PLAZO\s+(?:DE\s+)?EJECUCI[OÓ]N[:\s]+(\d+)\s*(MESES?)/i;
const RE_CT_MESES    = /(?:n|N)\s*=\s*(\d+)\s*MESES?/i;
const RE_CT_VALOR    = /CTd?\s*(?:ESTIMADO)?[:\s>=]+\$?\s*([\d.,]+)/i;
const RE_PATRIMONIO  = /PATRIMONIO\s+(?:DEMANDADO|M[IÍ]NIMO)[:\s>=]+\$?\s*([\d.,]+)/i;
const RE_CT_COND     = /CT\s*[>=]+\s*CTd/i;
const RE_CT_NOTA     = /(?:NOTA\s+IMPORTANTE|ADVERTENCIA)[:\s]+([^\n]{20,400})/i;

export function extractCapitalTrabajo(text, presupuestoRaw) {
  const section = extractSection(text,
    /CAPITAL\s+DE\s+TRABAJO/i,
    /CAPACIDAD\s+RESIDUAL|INDICADORES?\s+FINANCIEROS|CAP[IÍ]TULO\s+[IVX]+\s+\d/i,
  ) || text;

  const formulaMatch   = RE_CT_FORMULA.exec(section);
  const plazoMatch     = RE_CT_PLAZO.exec(text);
  const mesesMatch     = RE_CT_MESES.exec(section);
  const valorMatch     = RE_CT_VALOR.exec(section);
  const patrimonioMatch= RE_PATRIMONIO.exec(section);
  const condMatch      = RE_CT_COND.exec(section);
  const notaMatch      = RE_CT_NOTA.exec(section);

  const plazo  = plazoMatch ? parseInt(plazoMatch[1]) : null;
  const meses  = mesesMatch ? parseInt(mesesMatch[1]) : 3; // Por defecto 3 según pliegos tipo
  const presup = presupuestoRaw ? parseMoneyString(presupuestoRaw) : null;

  // CTd = (Presupuesto / Plazo) × n  — estimación según metodología CCE
  let ctdEstimado = valorMatch ? parseMoneyString(valorMatch[1]) : null;
  if (!ctdEstimado && presup && plazo) {
    ctdEstimado = (presup / plazo) * meses;
  }

  return {
    formula:             formulaMatch?.[1]?.trim() ?? 'CTd = (Presupuesto Oficial / Plazo) × n',
    plazoEjecucion:      plazo ? `${plazo} meses` : NIL,
    mesesApalancamiento: meses,
    ctdEstimado:         ctdEstimado ? String(Math.round(ctdEstimado)) : NIL,
    patrimonioDemandado: patrimonioMatch ? parseMoneyString(patrimonioMatch[1])?.toString() ?? NIL : NIL,
    condicion:           condMatch ? 'CT ≥ CTd' : 'CT ≥ CTd',
    notas:               notaMatch?.[1]?.trim() ?? '',
  };
}

// ─── CAPACIDAD RESIDUAL ───────────────────────────────────────────────────────

const RE_CR_SECTION  = /CAPACIDAD\s+RESIDUAL/i;
const RE_CR_END      = /CAP[IÍ]TULO\s+[IVX]+\s+\d|CRITERIOS?\s+DE\s+(?:EVALUACI[OÓ]N|SELECCI[OÓ]N)/i;
const RE_CRPC        = /CRPC?\s*[>=:]+\s*\$?\s*([\d.,]+)/i;
const RE_CRP_FORMULA = /CRP\s*=\s*([^\n]{10,200})/i;
const RE_CO          = /CO[:\s]+([^\n]{5,100})/i;

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
  // CRPC estándar CCE ≈ presupuesto oficial (el proponente debe poder absorberlo)
  const crpcEstimado = crpcMatch
    ? parseMoneyString(crpcMatch[1])?.toString()
    : presup ? String(Math.round(presup)) : NIL;

  return {
    crpcEstimado,
    formulaCRPC:  formulaMatch?.[1]?.trim() ?? 'CRP ≥ Presupuesto Oficial del Proceso',
    formulaCRP:   'CRP = CO × [(E + CT + CF) / 100] – SCE',
    factores:     FACTORES_STD,
  };
}
