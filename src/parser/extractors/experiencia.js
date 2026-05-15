/**
 * experiencia.js
 * --------------
 * Extrae los requisitos de experiencia general y específica del pliego.
 *
 * Los pliegos tipo CCE para obra pública presentan secciones como:
 *   "EXPERIENCIA GENERAL"  → actividades con código UNSPSC y valor mínimo
 *   "EXPERIENCIA ESPECÍFICA" → actividades con restricciones adicionales
 */

const NIL = 'No especificado en el pliego';

/**
 * Busca el bloque de texto entre dos encabezados de sección.
 * @param {string} text
 * @param {RegExp} startRe - Patrón del encabezado de inicio.
 * @param {RegExp} endRe   - Patrón del encabezado de fin (exclusivo).
 * @returns {string}
 */
function extractSection(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start === -1) return '';
  const sub = text.slice(start);
  const end = sub.search(endRe);
  return end === -1 ? sub : sub.slice(0, end);
}

// ─── EXPERIENCIA GENERAL ─────────────────────────────────────────────────────

const RE_EG_SECTION  = /EXPERIENCIA\s+GENERAL/i;
const RE_EG_END      = /EXPERIENCIA\s+ESPEC[IÍ]FICA|CAP[IÍ]TULO\s+[IVX]+\s+\d|REQUISITOS\s+HABILITANTES\s+JURI/i;
const RE_ACTIVIDAD   = /ACTIVIDAD\s+CONSTRUCTORA\s+(\d+)|ACTIVIDAD\s+([A-Z0-9\-]+)/gi;
const RE_CODIGO_EG   = /C[OÓ]DIGO\s+(?:UNSPSC)?[:\s]+(\d{6,8})/i;
const RE_DESC_EG     = /DESCRIPCI[OÓ]N[:\s]+([^\n]{10,300})/i;
const RE_OBS_EG      = /OBSERVACI[OÓ]N[:\s]+([^\n]{5,300})|NOTA[:\s]+([^\n]{5,300})/i;

/**
 * Divide el texto de experiencia general en bloques por actividad y los parsea.
 */
export function extractExperienciaGeneral(text) {
  const section = extractSection(text, RE_EG_SECTION, RE_EG_END);
  if (!section) return [];

  // Dividir por "ACTIVIDAD CONSTRUCTORA N" o "ACTIVIDAD N"
  const blocks = section.split(/(?=ACTIVIDAD\s+(?:CONSTRUCTORA\s+)?\d)/i).filter(b => b.length > 20);

  return blocks.map((block, i) => {
    const actMatch = /ACTIVIDAD\s+(?:CONSTRUCTORA\s+)?(\d+)/i.exec(block);
    const codMatch = RE_CODIGO_EG.exec(block);
    const desMatch = RE_DESC_EG.exec(block);
    const obsMatch = RE_OBS_EG.exec(block);

    return {
      actividad:    actMatch ? `Actividad Constructora ${actMatch[1]}` : `Actividad ${i + 1}`,
      codigo:       codMatch?.[1] ?? NIL,
      descripcion:  desMatch?.[1]?.trim() ?? NIL,
      observacion:  (obsMatch?.[1] ?? obsMatch?.[2])?.trim() ?? '',
    };
  }).filter(e => e.descripcion !== NIL);
}

// ─── EXPERIENCIA ESPECÍFICA ───────────────────────────────────────────────────

const RE_EES_SECTION = /EXPERIENCIA\s+ESPEC[IÍ]FICA/i;
const RE_EES_END     = /CAP[IÍ]TULO\s+[IVX]+\s+\d|INDICADORES?\s+FINANCIEROS|CAPACIDAD\s+RESIDUAL/i;
const RE_TIPO_EES    = /ACTIVIDAD\s+ESPEC[IÍ]FICA\s+([\d\-A-Z]+)/i;
const RE_REQUISITO   = /REQUISITO[:\s]+([^\n]{10,400})|HABER\s+EJECUTADO[^\n]{0,300}/i;
const RE_DOCS_EES    = /DOCUMENTOS?\s+(?:V[AÁ]LIDOS?|REQUERIDOS?)[:\s]+([^\n]{10,300})/i;
const RE_OBS_EES     = /(?:NOTA\s+IMPORTANTE|ADVERTENCIA|OBSERVACI[OÓ]N)[:\s]+([^\n]{5,400})/i;

export function extractExperienciaEspecifica(text) {
  const section = extractSection(text, RE_EES_SECTION, RE_EES_END);
  if (!section) return [];

  const blocks = section.split(/(?=ACTIVIDAD\s+ESPEC[IÍ]FICA)/i).filter(b => b.length > 20);

  return blocks.map((block, i) => {
    const tipoMatch = RE_TIPO_EES.exec(block);
    const reqMatch  = RE_REQUISITO.exec(block);
    const docMatch  = RE_DOCS_EES.exec(block);
    const obsMatch  = RE_OBS_EES.exec(block);

    // Intentar inferir el nombre de la actividad desde el contexto
    const actNombre = inferActivityName(block);

    return {
      actividad:   actNombre || `Actividad ${i + 1}`,
      tipo:        tipoMatch ? `Específica ${tipoMatch[1]}` : `Específica ${i + 1}`,
      requisito:   reqMatch?.[1]?.trim() ?? reqMatch?.[0]?.trim() ?? NIL,
      documentos:  docMatch?.[1]?.trim() ?? NIL,
      observacion: obsMatch?.[1]?.trim() ?? '',
    };
  }).filter(e => e.requisito !== NIL);
}

/** Infiere el nombre del tipo de actividad desde el bloque de texto */
function inferActivityName(block) {
  const keywords = [
    'ALCANTARILLADO', 'ACUEDUCTO', 'VÍAS', 'CARRETERAS', 'PUENTES',
    'EDIFICACIONES', 'URBANISMO', 'REDES', 'PAVIMENTACIÓN', 'ESTRUCTURAS',
    'HIDROSANITARIO', 'ELECTROMECÁNICO',
  ];
  for (const kw of keywords) {
    if (block.toUpperCase().includes(kw)) return kw;
  }
  return null;
}
