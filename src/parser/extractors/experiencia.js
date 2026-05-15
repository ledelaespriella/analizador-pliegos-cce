/**
 * @file experiencia.js — Extrae requisitos de experiencia del pliego.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Extrae los requisitos de experiencia general y especifica del pliego.
 *
 * Los pliegos tipo CCE para obra publica presentan secciones como:
 *   "EXPERIENCIA GENERAL"  → actividades con codigo UNSPSC y valor minimo
 *   "EXPERIENCIA ESPECIFICA" → actividades con restricciones adicionales
 *
 * Formato real: ACTIVIDAD PRINCIPAL / ACTIVIDAD SECUNDARIA con sub-bloques
 * de "Experiencia General" y "Experiencia Especifica".
 */

const NIL = 'No especificado en el pliego';

function extractSection(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start === -1) return '';
  const sub = text.slice(start);
  const end = sub.search(endRe);
  return end === -1 ? sub : sub.slice(0, end);
}

// ─── EXPERIENCIA GENERAL ─────────────────────────────────────────────────────

const RE_EXP_SECTION = /3\.5\.1\s+DETERMINACI[OÓ]N|3\.5\s+EXPERIENCIA/i;
const RE_EXP_END     = /3\.5\.2\s+CARACTER[IÍ]STICAS|INDICADORES?\s+FINANCIEROS|CAPACIDAD\s+(?:FINANCIERA|RESIDUAL)|3\.6\s|3\.7\s|CAP[IÍ]TULO\s+[IVX]+\s+\d/i;

export function extractExperienciaGeneral(text) {
  const section = extractSection(text, RE_EXP_SECTION, RE_EXP_END);
  if (!section) return [];

  const results = [];

  // Split by ACTIVIDAD PRINCIPAL / ACTIVIDAD SECUNDARIA blocks
  const activityBlocks = section.split(/(?=ACTIVIDAD\s+(?:PRINCIPAL|SECUNDARIA)\s*(?:\d+)?[:\s])/i);

  for (const block of activityBlocks) {
    if (block.length < 30) continue;

    // Determine activity type (Principal / Secundaria N)
    const actTypeMatch = /ACTIVIDAD\s+(PRINCIPAL|SECUNDARIA)\s*(\d+)?/i.exec(block);
    const actType = actTypeMatch
      ? `Actividad ${actTypeMatch[1]}${actTypeMatch[2] ? ' ' + actTypeMatch[2] : ''}`
      : null;
    if (!actType) continue;

    // Extract the activity number/code (e.g., "6.1", "7.2", "6.10")
    const codeMatch = /(\d+\.\d+)\s+PROYECTOS?\s+DE\s+/i.exec(block);
    const actCode = codeMatch ? codeMatch[1] : '';

    // Extract activity description (after the code line)
    const descMatch = /\d+\.\d+\s+(PROYECTOS?\s+DE\s+[^\n]{10,200})/i.exec(block);
    const descripcion = descMatch ? descMatch[1].trim() : '';

    // Extract "Experiencia General" requirement text
    const egMatch = /Experiencia\s+General[:\s]+([^\n]{10,400})/i.exec(block);
    const expGeneral = egMatch ? egMatch[1].trim() : '';

    // Extract UNSPSC codes mentioned in this block
    const unspscCodes = [];
    const reUNSPSC = /\b(\d{8})\b/g;
    let um;
    while ((um = reUNSPSC.exec(block)) !== null) {
      if (!unspscCodes.includes(um[1])) unspscCodes.push(um[1]);
    }

    results.push({
      actividad:    actType,
      codigo:       actCode || (unspscCodes[0] ?? NIL),
      descripcion:  descripcion || expGeneral || NIL,
      observacion:  unspscCodes.length ? `Códigos UNSPSC: ${unspscCodes.join(', ')}` : '',
    });
  }

  // Fallback: try "ACTIVIDAD CONSTRUCTORA N" blocks (older CCE format)
  if (!results.length) {
    const blocks = section.split(/(?=ACTIVIDAD\s+(?:CONSTRUCTORA\s+)?\d)/i).filter(b => b.length > 20);
    for (const block of blocks) {
      const actMatch = /ACTIVIDAD\s+(?:CONSTRUCTORA\s+)?(\d+)/i.exec(block);
      const descMatch = /DESCRIPCI[OÓ]N[:\s]+([^\n]{10,300})/i.exec(block);
      const codMatch = /C[OÓ]DIGO\s+(?:UNSPSC)?[:\s]+(\d{6,8})/i.exec(block);
      if (actMatch) {
        results.push({
          actividad:   `Actividad Constructora ${actMatch[1]}`,
          codigo:      codMatch?.[1] ?? NIL,
          descripcion: descMatch?.[1]?.trim() ?? NIL,
          observacion: '',
        });
      }
    }
  }

  const unique = [];
  for (const r of results) {
    const isDup = unique.some(u => u.descripcion.slice(0, 60) === r.descripcion.slice(0, 60));
    // Filter noise: short descriptions or descriptions that don't describe a project
    const isNoise = r.descripcion.length < 20 || /^(?:solicitada|y\s+espec|contexto)/i.test(r.descripcion);
    if (!isDup && !isNoise) unique.push(r);
  }
  return unique.filter(e => e.descripcion !== NIL);
}

// ─── EXPERIENCIA ESPECÍFICA ───────────────────────────────────────────────────

export function extractExperienciaEspecifica(text) {
  const section = extractSection(text, RE_EXP_SECTION, RE_EXP_END);
  if (!section) return [];

  const results = [];

  // Find all "Experiencia Especifica" blocks (handles PDF artifacts like "Exper iencia")
  const eeBlocks = section.split(/(?=Exper\s*iencia\s+Espec[ií]f?i?\s*ca\s*(?:\d+)?[:\s])/i);

  for (const block of eeBlocks) {
    if (block.length < 20) continue;

    const headerMatch = /Exper\s*iencia\s+Espec[ií]f?i?\s*ca\s*(\d+)?/i.exec(block);
    if (!headerMatch) continue;

    const num = headerMatch[1] ?? '';
    const tipo = num ? `Específica ${num}` : 'Específica';

    const reqStart = headerMatch.index + headerMatch[0].length;
    const reqText = block.slice(reqStart, reqStart + 600)
      .split(/\n(?=ACTIVIDAD|Nota\s+\d|3\.\d)/i)[0]
      .replace(/\s+/g, ' ')
      .trim();

    // Try to infer the parent activity
    const parentMatch = /ACTIVIDAD\s+(PRINCIPAL|SECUNDARIA)\s*(\d+)?/i.exec(block);
    const parentName = parentMatch
      ? `${parentMatch[1]}${parentMatch[2] ? ' ' + parentMatch[2] : ''}`
      : inferActivityName(block);

    results.push({
      actividad:   parentName || `Experiencia ${tipo}`,
      tipo,
      requisito:   reqText || NIL,
      documentos:  NIL,
      observacion: '',
    });
  }

  // Fallback: old "ACTIVIDAD ESPECIFICA" format
  if (!results.length) {
    const oldSection = extractSection(text, /EXPERIENCIA\s+ESPEC[IÍ]FICA/i,
      /CAP[IÍ]TULO\s+[IVX]+\s+\d|INDICADORES?\s+FINANCIEROS|CAPACIDAD\s+RESIDUAL/i);
    if (oldSection) {
      const blocks = oldSection.split(/(?=ACTIVIDAD\s+ESPEC[IÍ]FICA)/i).filter(b => b.length > 20);
      for (const block of blocks) {
        const reqMatch = /REQUISITO[:\s]+([^\n]{10,400})|HABER\s+EJECUTADO[^\n]{0,300}/i.exec(block);
        if (reqMatch) {
          results.push({
            actividad:   inferActivityName(block) || 'Experiencia Específica',
            tipo:        'Específica',
            requisito:   reqMatch[1]?.trim() ?? reqMatch[0]?.trim() ?? NIL,
            documentos:  NIL,
            observacion: '',
          });
        }
      }
    }
  }

  // Deduplicate by full requisito text
  const unique = [];
  for (const r of results) {
    const isDup = unique.some(u => u.requisito.slice(0, 150) === r.requisito.slice(0, 150));
    if (!isDup) unique.push(r);
  }
  return unique.filter(e => e.requisito !== NIL && e.requisito.length > 15);
}

function inferActivityName(block) {
  const keywords = [
    'ALCANTARILLADO', 'ACUEDUCTO', 'VÍAS', 'CARRETERAS', 'PUENTES',
    'EDIFICACIONES', 'URBANISMO', 'REDES', 'PAVIMENTACIÓN', 'ESTRUCTURAS',
    'HIDROSANITARIO', 'ELECTROMECÁNICO', 'INTERCAMBIADOR', 'INFRAESTRUCTURA VIAL',
    'TRÁNSITO MASIVO', 'PASO A DESNIVEL',
  ];
  for (const kw of keywords) {
    if (block.toUpperCase().includes(kw)) return kw;
  }
  return null;
}
