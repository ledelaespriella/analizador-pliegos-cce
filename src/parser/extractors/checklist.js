/**
 * @file checklist.js — Genera el checklist de documentos para la oferta.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Genera el checklist de documentos a presentar en la oferta,
 * cruzando los datos extraidos del pliego con la plantilla estandar CCE.
 *
 * El checklist se construye dinámicamente según:
 *  - Requisitos habilitantes detectados.
 *  - Factores ponderables encontrados.
 *  - Campos del resumen (anticipo, AIU, etc.).
 */

/**
 * Genera el checklist completo de documentos.
 *
 * @param {object} parsed - Datos ya extraídos por los demás extractores.
 * @returns {Array<object>}
 */
export function buildChecklist(parsed) {
  const items = [];
  let num = 1;

  const add = (documento, tipo, observacion, critico = false) => {
    items.push({ numero: num++, documento, tipo, observacion, critico });
  };

  // ── JURÍDICOS ─────────────────────────────────────────────────────────────
  add('Carta de Presentación de la Oferta',
      'HABILITANTE JURÍDICO',
      'Firmada por el representante legal o apoderado. Debe incluir dirección, teléfono y correo.',
      true);

  add('RUP — Registro Único de Proponentes',
      'HABILITANTE JURÍDICO',
      'Vigente y en firme a la fecha de cierre. Inscrito en la actividad y especialidad requerida.',
      true);

  add('Certificado de Existencia y Representación Legal',
      'HABILITANTE JURÍDICO',
      'Expedido por la Cámara de Comercio. Máximo 30 días antes del cierre.',
      true);

  add('Garantía de Seriedad de la Oferta',
      'HABILITANTE JURÍDICO',
      'Póliza o garantía bancaria por el 10% del presupuesto oficial. Vigencia mínima 90 días.',
      true);

  add('Certificado de Antecedentes Disciplinarios (Procuraduría)',
      'HABILITANTE JURÍDICO',
      'Para personas jurídicas y representante legal. Sin sanciones vigentes.',
      true);

  add('Certificado de Antecedentes Fiscales (Contraloría)',
      'HABILITANTE JURÍDICO',
      'Para personas jurídicas y representante legal. Sin inhabilidades.',
      true);

  add('Certificado de Antecedentes Penales (Policía)',
      'HABILITANTE JURÍDICO',
      'Para el representante legal.',
      false);

  add('Boletín de Responsables Fiscales',
      'HABILITANTE JURÍDICO',
      'Consultar en el sistema de la Contraloría General.',
      true);

  // ── FINANCIEROS ───────────────────────────────────────────────────────────
  add('Estados Financieros del último año fiscal',
      'HABILITANTE FINANCIERO',
      'Balance General y Estado de Resultados, firmados por Revisor Fiscal o Contador según aplique.',
      true);

  add('Notas a los Estados Financieros',
      'HABILITANTE FINANCIERO',
      'Deben incluir metodología de valoración de activos y pasivos corrientes.',
      false);

  add('Declaración de Renta del último año gravable',
      'HABILITANTE FINANCIERO',
      'Con constancia de presentación ante la DIAN.',
      false);

  // ── TÉCNICOS — EXPERIENCIA ────────────────────────────────────────────────
  add('Certificaciones de Experiencia General',
      'HABILITANTE TÉCNICO',
      'Actas de liquidación, contratos o certificaciones suscritas por el contratante. Deben indicar objeto, valor, plazo y código UNSPSC.',
      true);

  add('Certificaciones de Experiencia Específica',
      'HABILITANTE TÉCNICO',
      'Deben acreditar los montos mínimos requeridos en la actividad específica. Incluir cantidades de obra si aplica.',
      true);

  add('Formato R1 — Capacidad Residual (RUP)',
      'HABILITANTE TÉCNICO',
      'Diligenciado y firmado. Soporta el cálculo de CRP ≥ CRPC del proceso.',
      true);

  // ── CAPACIDAD TÉCNICA — PERSONAL ──────────────────────────────────────────
  if (parsed.puntajes?.some(p => /calidad/i.test(p.criterio))) {
    add('Hojas de Vida Personal Profesional Clave',
        'PONDERABLE CALIDAD',
        'Director de Obra, Residente de Obra y demás según pliego. Con soportes de título y matrícula profesional.',
        false);

    add('Soportes de Formación Académica Personal Clave',
        'PONDERABLE CALIDAD',
        'Diplomas, actas de grado y tarjetas profesionales vigentes.',
        false);

    add('Soportes de Experiencia Personal Clave',
        'PONDERABLE CALIDAD',
        'Certificaciones laborales o contratos que acrediten experiencia específica del personal propuesto.',
        false);

    add('Plan de Trabajo y Metodología',
        'PONDERABLE CALIDAD',
        'Cronograma de actividades, metodología constructiva, plan de gestión ambiental y social.',
        false);
  }

  // ── ANTICIPO ──────────────────────────────────────────────────────────────
  if (parsed.resumen?.anticipo && !/no especificado|0\s*%/i.test(parsed.resumen.anticipo)) {
    add('Garantía de Buen Manejo del Anticipo',
        'CONTRACTUAL',
        `Póliza por el 100% del valor del anticipo (${parsed.resumen.anticipo}). Se entrega al firmar el contrato.`,
        false);
  }

  // ── INDUSTRIA NACIONAL ────────────────────────────────────────────────────
  if (parsed.puntajes?.some(p => /industria/i.test(p.criterio))) {
    add('Formulario de Apoyo a la Industria Nacional',
        'PONDERABLE INDUSTRIA',
        'Indicar % de bienes y servicios de origen nacional. Soportar con certificados de origen si aplica.',
        false);
  }

  // ── MIPYME ────────────────────────────────────────────────────────────────
  if (parsed.puntajes?.some(p => /mipyme/i.test(p.criterio))) {
    add('Certificado MIPYME',
        'PONDERABLE MIPYME',
        'Expedido por el Ministerio de Comercio, Industria y Turismo o Cámara de Comercio.',
        false);
  }

  // ── DISCAPACIDAD ──────────────────────────────────────────────────────────
  if (parsed.puntajes?.some(p => /discapacidad/i.test(p.criterio))) {
    add('Certificado Vinculación Personas con Discapacidad',
        'PONDERABLE DISCAPACIDAD',
        'Emitido por FUPAD Colombia o Ministerio de Salud. Contratos laborales adjuntos.',
        false);
  }

  // ── EMPRESA DE MUJERES ────────────────────────────────────────────────────
  if (parsed.puntajes?.some(p => /mujeres/i.test(p.criterio))) {
    add('Certificado Empresa de Mujeres',
        'PONDERABLE EQUIDAD',
        'Certificado de cámara de comercio con composición accionaria que acredite mayoría femenina.',
        false);
  }

  // ── OFERTA ECONÓMICA ──────────────────────────────────────────────────────
  add('Formulario de Oferta Económica',
      'PONDERABLE ECONÓMICO',
      'Según el formato establecido en el pliego. Incluye valor total de la propuesta con IVA si aplica.',
      true);

  add('Análisis de Precios Unitarios (APU)',
      'PONDERABLE ECONÓMICO',
      'Para cada ítem del presupuesto. Firmados por el Director de Obra propuesto.',
      false);

  add('Formulario de AIU',
      'PONDERABLE ECONÓMICO',
      `AIU propuesto no debe superar el máximo establecido en el pliego: ${parsed.resumen?.aiu ?? 'Ver pliego'}.`,
      false);

  return items;
}
