/**
 * @file parametros.js — Genera parametros clave y alertas criticas.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Genera la lista de "Parametros Clave para Licitar" y las alertas criticas
 * a partir de los datos ya extraidos del pliego.
 *
 * Cada parámetro tiene nivel: 'critico' | 'warning' | 'ok'
 */

import { fmtCOP } from '../../utils/formatters.js';

const NIL = 'No especificado en el pliego';

/**
 * Genera parámetros clave y alertas críticas.
 *
 * @param {object} parsed - Datos completos extraídos del pliego.
 * @returns {{ parametrosLicitar: Array, alertasCriticas: Array }}
 */
export function buildParametrosYAlertas(parsed) {
  const params = [];
  const alertas = [];

  const r = parsed.resumen ?? {};
  const ct = parsed.capitalTrabajo ?? {};
  const cr = parsed.capacidadResidual ?? {};

  // ── PRESUPUESTO ───────────────────────────────────────────────────────────
  if (r.presupuesto && r.presupuesto !== NIL) {
    params.push({
      parametro:   'Presupuesto Oficial',
      valor:       fmtCOP(r.presupuesto),
      advertencia: 'No puede ofertarse por encima de este valor. Revisar APU vs. presupuesto oficial.',
      nivel:       'ok',
    });
  } else {
    alertas.push({
      tipo:        'warning',
      titulo:      'Presupuesto no identificado',
      descripcion: 'No se encontró el valor del presupuesto oficial en el documento. Verificar manualmente.',
    });
  }

  // ── PLAZO ─────────────────────────────────────────────────────────────────
  if (r.plazo && r.plazo !== NIL) {
    params.push({
      parametro:   'Plazo de Ejecución',
      valor:       r.plazo,
      advertencia: 'El cronograma de trabajo debe ajustarse estrictamente a este plazo desde el Acta de Inicio.',
      nivel:       'ok',
    });
  } else {
    alertas.push({
      tipo:        'warning',
      titulo:      'Plazo no identificado',
      descripcion: 'No se encontró el plazo de ejecución. Ubicar en el Capítulo de Condiciones Especiales.',
    });
  }

  // ── ANTICIPO ──────────────────────────────────────────────────────────────
  if (r.anticipo && r.anticipo !== NIL) {
    params.push({
      parametro:   'Anticipo',
      valor:       r.anticipo,
      advertencia: 'Si hay anticipo, se debe constituir póliza de Buen Manejo por el 100% antes de la firma.',
      nivel:       /\b0\s*%|sin anticipo|no hay/i.test(r.anticipo) ? 'ok' : 'warning',
    });
  }

  // ── AIU ───────────────────────────────────────────────────────────────────
  if (r.aiu && r.aiu !== NIL) {
    params.push({
      parametro:   'AIU Máximo Permitido',
      valor:       r.aiu,
      advertencia: 'El AIU ofertado NO puede superar este porcentaje. Revisar estructura de costos.',
      nivel:       'critico',
    });
    alertas.push({
      tipo:        'warning',
      titulo:      `AIU máximo: ${r.aiu}`,
      descripcion: `El pliego limita el AIU al ${r.aiu}. Asegúrese de que su estructura de costos sea rentable dentro de este margen.`,
    });
  }

  // ── CAPITAL DE TRABAJO ────────────────────────────────────────────────────
  if (ct.ctdEstimado && ct.ctdEstimado !== NIL) {
    params.push({
      parametro:   'Capital de Trabajo Demandado (CTd)',
      valor:       fmtCOP(ct.ctdEstimado),
      advertencia: `El capital de trabajo declarado (Activo Cte – Pasivo Cte) debe ser ≥ ${fmtCOP(ct.ctdEstimado)}.`,
      nivel:       'critico',
    });
    alertas.push({
      tipo:        'error',
      titulo:      'Verificar Capital de Trabajo',
      descripcion: `El CTd estimado es ${fmtCOP(ct.ctdEstimado)}. Si su CT declarado en estados financieros no alcanza este valor, la oferta será inhabilitada.`,
    });
  }

  // ── CAPACIDAD RESIDUAL ────────────────────────────────────────────────────
  if (cr.crpcEstimado && cr.crpcEstimado !== NIL) {
    params.push({
      parametro:   'Capacidad Residual del Proceso (CRPC)',
      valor:       fmtCOP(cr.crpcEstimado),
      advertencia: 'Su CRP calculado debe ser ≥ CRPC. Tenga en cuenta contratos vigentes en ejecución (SCE).',
      nivel:       'critico',
    });
    alertas.push({
      tipo:        'error',
      titulo:      'Verificar Capacidad Residual',
      descripcion: `CRPC estimado: ${fmtCOP(cr.crpcEstimado)}. Calcule su CRP = CO × [(E + CT + CF) / 100] – SCE antes de presentar oferta.`,
    });
  }

  // ── COMPLEJIDAD ───────────────────────────────────────────────────────────
  if (r.complejidad && r.complejidad !== NIL) {
    params.push({
      parametro:   'Nivel de Complejidad del Proceso',
      valor:       r.complejidad,
      advertencia: r.complejidad === 'Alta'
        ? 'Proceso de alta complejidad: mayor exigencia técnica y financiera. Evalúe si cumple todos los requisitos.'
        : 'Verifique los requisitos de complejidad en el RUP.',
      nivel:       r.complejidad === 'Alta' ? 'critico' : r.complejidad === 'Media' ? 'warning' : 'ok',
    });
  }

  // ── RUP ───────────────────────────────────────────────────────────────────
  params.push({
    parametro:   'RUP — Actividades UNSPSC Inscritas',
    valor:       parsed.resumen?.unspsc?.slice(0, 2).join(' | ') || 'Ver sección Experiencia General',
    advertencia: 'El RUP debe estar inscrito en los códigos UNSPSC requeridos y con la clasificación correcta de complejidad.',
    nivel:       'critico',
  });
  alertas.push({
    tipo:        'error',
    titulo:      'Verificar inscripción RUP',
    descripcion: 'El RUP debe estar vigente, en firme y con la clasificación en actividades UNSPSC requeridas a la fecha de cierre del proceso.',
  });

  // ── SECOP II ──────────────────────────────────────────────────────────────
  params.push({
    parametro:   'Presentación de Oferta',
    valor:       'SECOP II — Plataforma electrónica',
    advertencia: 'Las ofertas deben presentarse EXCLUSIVAMENTE a través de SECOP II antes de la fecha y hora de cierre.',
    nivel:       'critico',
  });

  // ── FORMA DE PAGO ─────────────────────────────────────────────────────────
  if (r.formaPago && r.formaPago !== NIL) {
    params.push({
      parametro:   'Forma de Pago',
      valor:       r.formaPago.slice(0, 100),
      advertencia: 'Verificar flujo de caja del proyecto con la forma de pago establecida.',
      nivel:       'warning',
    });
  }

  // ── ALERTA VALORES ESTIMADOS ──────────────────────────────────────────────
  alertas.push({
    tipo:        'warning',
    titulo:      'Valores financieros son estimados',
    descripcion: 'Los valores de CTd y CRPC mostrados son estimaciones basadas en patrones del pliego. Verificar con el documento oficial publicado en SECOP II.',
  });

  return { parametrosLicitar: params, alertasCriticas: alertas };
}
