/**
 * @file pliegoParser.js — Orquestador principal del analisis de pliegos.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Recibe el texto extraído del PDF y coordina todos los extractores
 * especializados, devolviendo un objeto JSON con la misma estructura
 * que producía la versión basada en IA — garantizando compatibilidad
 * total con el Dashboard.
 *
 * Flujo:
 *  1. extractResumen()           → datos generales del proceso
 *  2. extractExperienciaGeneral()
 *  3. extractExperienciaEspecifica()
 *  4. extractIndicadoresFinancieros()
 *  5. extractCapitalTrabajo()
 *  6. extractCapacidadResidual()
 *  7. extractPuntajes()
 *  8. extractMetodologiaEvaluacion()
 *  9. extractRequisitosHabilitantes()
 * 10. buildChecklist()
 * 11. buildParametrosYAlertas()
 */

import { cleanText } from '../utils/formatters.js';
import { extractResumen }                              from './extractors/resumen.js';
import { extractExperienciaGeneral, extractExperienciaEspecifica } from './extractors/experiencia.js';
import { extractIndicadoresFinancieros, extractCapitalTrabajo, extractCapacidadResidual } from './extractors/financiero.js';
import { extractPuntajes, extractMetodologiaEvaluacion, extractRequisitosHabilitantes } from './extractors/puntajes.js';
import { buildChecklist }                              from './extractors/checklist.js';
import { buildParametrosYAlertas }                     from './extractors/parametros.js';

/**
 * Analiza el texto completo de un pliego y retorna el objeto de datos
 * listo para el Dashboard.
 *
 * @param {string} rawText - Texto extraído del PDF por pdfExtractor.
 * @param {function(number): void} [onStep] - Callback de progreso (0–10).
 * @returns {object} - Objeto con todos los campos del Dashboard.
 */
export async function parsePliego(rawText, onStep = () => {}) {
  const text = cleanText(rawText);

  onStep(1);
  const resumen = extractResumen(text);

  onStep(2);
  const experienciaGeneral = extractExperienciaGeneral(text);

  onStep(3);
  const experienciaEspecifica = extractExperienciaEspecifica(text);

  onStep(4);
  const indicadoresFinancieros = extractIndicadoresFinancieros(text);

  onStep(5);
  const capitalTrabajo = extractCapitalTrabajo(text, resumen.presupuesto);

  onStep(6);
  const capacidadResidual = extractCapacidadResidual(text, resumen.presupuesto);

  onStep(7);
  const puntajes = extractPuntajes(text);

  onStep(8);
  const metodologiaEvaluacion = extractMetodologiaEvaluacion(text);
  const requisitosHabilitantes = extractRequisitosHabilitantes(text);

  // Objeto parcial para pasar contexto al checklist y parámetros
  const partial = { resumen, puntajes, capitalTrabajo, capacidadResidual };

  onStep(9);
  const checklist = buildChecklist(partial);

  onStep(10);
  const { parametrosLicitar, alertasCriticas } = buildParametrosYAlertas(partial);

  const totalPuntaje = puntajes.reduce((s, p) => s + (p.puntos ?? 0), 0);

  return {
    resumen,
    experienciaGeneral,
    experienciaEspecifica,
    indicadoresFinancieros,
    capitalTrabajo,
    capacidadResidual,
    puntajes,
    totalPuntaje: parseFloat(totalPuntaje.toFixed(2)),
    metodologiaEvaluacion,
    requisitosHabilitantes,
    requisitosPonderables: [],  // Reservado para extracción futura detallada
    checklist,
    parametrosLicitar,
    alertasCriticas,
  };
}
