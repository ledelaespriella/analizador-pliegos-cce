/**
 * @file excelExport.js — Generador de Excel profesional con los hallazgos del pliego.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Construye un .xlsx con:
 *   1. Portada            — datos generales + KPIs.
 *   2. Documentos por Tipo — hoja consolidada agrupada por tipo (la pidió el usuario).
 *   3. Checklist Completo  — lista numerada con criticidad.
 *   4. Resumen del Proceso — todos los campos extraídos.
 *   5. Experiencia         — general + específica.
 *   6. Financiero          — indicadores, capital de trabajo, capacidad residual.
 *   7. Puntajes            — criterios ponderables.
 *   8. Requisitos Habilit. — checklist obligatoria.
 *   9. Parámetros y Alertas.
 *
 * Convención de estilos: cabecera teal con texto blanco; columnas auto-anchas
 * según contenido; valores monetarios en formato COP; documentos críticos en rojo.
 */

import ExcelJS from 'exceljs';
import { fmtCOP } from '../utils/formatters.js';

// ─── PALETA ──────────────────────────────────────────────────────────────────
const COLORS = {
  teal:      'FF0F766E',
  tealSoft:  'FFCCFBF1',
  gold:      'FFCA8A04',
  goldSoft:  'FFFEF9C3',
  red:       'FFB91C1C',
  redSoft:   'FFFEE2E2',
  green:     'FF15803D',
  greenSoft: 'FFDCFCE7',
  blue:      'FF1D4ED8',
  blueSoft:  'FFDBEAFE',
  gray:      'FF374151',
  graySoft:  'FFF3F4F6',
  white:     'FFFFFFFF',
};

const FONT_HEADER = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.white } };
const FONT_TITLE  = { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.teal } };
const FONT_SUB    = { name: 'Calibri', size: 10, italic: true, color: { argb: COLORS.gray } };
const FONT_BODY   = { name: 'Calibri', size: 10 };

const BORDER_ALL = {
  top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function styleHeaderRow(row, fillArgb = COLORS.teal) {
  row.eachCell({ includeEmpty: false }, cell => {
    cell.font = FONT_HEADER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_ALL;
  });
  row.height = 22;
}

function styleBodyRow(row, fillArgb = null) {
  row.eachCell({ includeEmpty: false }, cell => {
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'top', wrapText: true };
    cell.border = BORDER_ALL;
    if (fillArgb) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
    }
  });
}

/** Ajusta el ancho de cada columna al máximo del contenido (acotado). */
function autoFitColumns(sheet, padding = 2, max = 60) {
  sheet.columns.forEach(col => {
    let maxLen = (col.header ?? '').toString().length;
    col.eachCell({ includeEmpty: false }, cell => {
      const v = cell.value == null ? '' : String(cell.value);
      // Para celdas con wrapText estimamos por línea más larga
      const longestLine = v.split('\n').reduce((m, s) => Math.max(m, s.length), 0);
      if (longestLine > maxLen) maxLen = longestLine;
    });
    col.width = Math.min(max, Math.max(12, maxLen + padding));
  });
}

function addTitle(sheet, title, subtitle) {
  sheet.addRow([title]);
  const titleRow = sheet.lastRow;
  titleRow.font = FONT_TITLE;
  titleRow.height = 26;
  sheet.mergeCells(`A${titleRow.number}:F${titleRow.number}`);

  if (subtitle) {
    sheet.addRow([subtitle]);
    const subRow = sheet.lastRow;
    subRow.font = FONT_SUB;
    sheet.mergeCells(`A${subRow.number}:F${subRow.number}`);
  }
  sheet.addRow([]); // espaciador
}

function clean(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    return value === 'No especificado en el pliego' ? '—' : value;
  }
  return value;
}

// ─── HOJA: PORTADA ───────────────────────────────────────────────────────────

function buildPortada(wb, data) {
  const sheet = wb.addWorksheet('Portada', {
    properties: { tabColor: { argb: COLORS.teal } },
    views: [{ showGridLines: false }],
  });

  const r  = data.resumen ?? {};
  const ct = data.capitalTrabajo ?? {};
  const cr = data.capacidadResidual ?? {};
  const totalPts = (data.puntajes ?? []).reduce((s, p) => s + (p.puntos ?? 0), 0);

  addTitle(
    sheet,
    'ANÁLISIS DE PLIEGO DE CONDICIONES — CCE',
    `Generado el ${new Date().toLocaleString('es-CO')} · Procesamiento 100% local`,
  );

  sheet.addRow(['Proceso',         clean(r.proceso)]);
  sheet.addRow(['Entidad',         clean(r.entidad)]);
  sheet.addRow(['NIT',             clean(r.nit)]);
  sheet.addRow(['Modalidad',       clean(r.modalidad)]);
  sheet.addRow(['Tipo de contrato',clean(r.tipoContrato)]);
  sheet.addRow(['Objeto',          clean(r.objeto)]);
  sheet.addRow([]);

  const kpiHeader = sheet.addRow(['Indicador clave', 'Valor', 'Observación']);
  styleHeaderRow(kpiHeader);

  const kpis = [
    ['Presupuesto Oficial',   fmtCOP(r.presupuesto),       'Tope máximo a ofertar'],
    ['Plazo de Ejecución',    clean(r.plazo),              'Desde acta de inicio'],
    ['Anticipo',              clean(r.anticipo),           'Requiere póliza si > 0%'],
    ['AIU Máximo',            clean(r.aiu),                'No superable por el oferente'],
    ['Complejidad',           clean(r.complejidad),        'Influye en requisitos RUP'],
    ['Capital de Trabajo (CTd)', fmtCOP(ct.ctdEstimado),   ct.ctdEsEstimado ? 'Valor estimado' : 'Extraído del pliego'],
    ['Capacidad Residual (CRPC)', fmtCOP(cr.crpcEstimado), cr.crpcEsEstimado ? 'Valor estimado' : 'Extraído del pliego'],
    ['Total Puntaje Máximo',  `${totalPts.toFixed(2)} pts`,'Suma criterios ponderables'],
  ];

  for (const [k, v, obs] of kpis) {
    const row = sheet.addRow([k, v, obs]);
    styleBodyRow(row);
    row.getCell(1).font = { ...FONT_BODY, bold: true };
  }

  // Anchura de columnas fija para presentación tipo portada
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 38;
  sheet.getColumn(3).width = 40;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
}

// ─── HOJA: DOCUMENTOS POR TIPO (consolidada, solicitada explícitamente) ──────

function buildDocumentosPorTipo(wb, data) {
  const sheet = wb.addWorksheet('Documentos por Tipo', {
    properties: { tabColor: { argb: COLORS.gold } },
    views: [{ showGridLines: false, state: 'frozen', ySplit: 5 }],
  });

  const list = data.checklist ?? [];

  // Agrupar por "tipo" (HABILITANTE JURÍDICO, PONDERABLE CALIDAD, etc.)
  const groups = new Map();
  for (const item of list) {
    const tipo = item.tipo ?? 'OTROS';
    if (!groups.has(tipo)) groups.set(tipo, []);
    groups.get(tipo).push(item);
  }

  // Orden de tipos: habilitantes primero, después ponderables, después contractual
  const tipoOrder = (t) => {
    if (t.startsWith('HABILITANTE JURÍDICO'))   return 1;
    if (t.startsWith('HABILITANTE FINANCIERO')) return 2;
    if (t.startsWith('HABILITANTE TÉCNICO'))    return 3;
    if (t.startsWith('HABILITANTE'))            return 4;
    if (t.startsWith('PONDERABLE'))             return 5;
    if (t.startsWith('CONTRACTUAL'))            return 6;
    return 9;
  };
  const sortedTipos = [...groups.keys()].sort((a, b) => tipoOrder(a) - tipoOrder(b) || a.localeCompare(b));

  addTitle(
    sheet,
    'CHECKLIST DE DOCUMENTOS — Agrupado por tipo',
    `Total: ${list.length} documentos en ${sortedTipos.length} categorías`,
  );

  const headerRow = sheet.addRow(['#', 'Documento', 'Categoría', 'Crítico', 'Observación / Notas']);
  styleHeaderRow(headerRow);

  for (const tipo of sortedTipos) {
    const items = groups.get(tipo);
    const totalTipo = items.length;
    const criticos  = items.filter(i => i.critico).length;

    // Subcabecera de la categoría
    const subRow = sheet.addRow([
      `${tipo}  ·  ${totalTipo} doc${totalTipo === 1 ? '' : 's'}  ·  ${criticos} crítico${criticos === 1 ? '' : 's'}`,
    ]);
    sheet.mergeCells(`A${subRow.number}:E${subRow.number}`);
    const sCell = subRow.getCell(1);
    sCell.font = { ...FONT_HEADER, color: { argb: COLORS.gray }, size: 11 };
    sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.graySoft } };
    sCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sCell.border = BORDER_ALL;
    subRow.height = 20;

    for (const item of items) {
      const row = sheet.addRow([
        item.numero,
        item.documento,
        item.tipo,
        item.critico ? 'SÍ' : 'No',
        item.observacion ?? '',
      ]);
      styleBodyRow(row, item.critico ? COLORS.redSoft : null);
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'top' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      if (item.critico) {
        row.getCell(4).font = { ...FONT_BODY, bold: true, color: { argb: COLORS.red } };
      }
    }
  }

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 28;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 55;
}

// ─── HOJA: CHECKLIST COMPLETO (vista plana) ──────────────────────────────────

function buildChecklistPlano(wb, data) {
  const sheet = wb.addWorksheet('Checklist Completo', {
    properties: { tabColor: { argb: COLORS.green } },
    views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
  });

  addTitle(sheet, 'CHECKLIST COMPLETO DE DOCUMENTOS', 'Lista numerada, ordenada como en el dashboard');

  const headerRow = sheet.addRow(['#', 'Documento', 'Tipo', 'Crítico', 'Observación']);
  styleHeaderRow(headerRow);

  for (const item of data.checklist ?? []) {
    const row = sheet.addRow([
      item.numero,
      item.documento,
      item.tipo,
      item.critico ? 'SÍ' : 'No',
      item.observacion ?? '',
    ]);
    styleBodyRow(row, item.critico ? COLORS.redSoft : null);
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
  }

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 28;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 55;
}

// ─── HOJA: RESUMEN DEL PROCESO ───────────────────────────────────────────────

function buildResumen(wb, data) {
  const sheet = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: COLORS.blue } },
    views: [{ showGridLines: false }],
  });
  addTitle(sheet, 'RESUMEN DEL PROCESO', 'Todos los campos extraídos de la sección de datos generales');

  const r = data.resumen ?? {};
  const headerRow = sheet.addRow(['Campo', 'Valor']);
  styleHeaderRow(headerRow);

  const filas = [
    ['Número del proceso',          r.proceso],
    ['Objeto',                      r.objeto],
    ['Entidad contratante',         r.entidad],
    ['NIT',                         r.nit],
    ['Dependencia',                 r.dependencia],
    ['Tipo de contrato',            r.tipoContrato],
    ['Modalidad de selección',      r.modalidad],
    ['Presupuesto oficial',         fmtCOP(r.presupuesto)],
    ['Anticipo',                    r.anticipo],
    ['Forma de pago',               r.formaPago],
    ['Plazo de ejecución',          r.plazo],
    ['Lugar de ejecución',          r.lugar],
    ['AIU máximo',                  r.aiu],
    ['Nivel de complejidad',        r.complejidad],
    ['Fecha de estudios previos',   r.fechaEstudios],
  ];

  for (const [k, v] of filas) {
    const row = sheet.addRow([k, clean(v)]);
    styleBodyRow(row);
    row.getCell(1).font = { ...FONT_BODY, bold: true };
  }

  // UNSPSC como filas adicionales
  const codes = r.unspsc ?? [];
  if (codes.length) {
    sheet.addRow([]);
    const h2 = sheet.addRow(['Códigos UNSPSC', '']);
    styleHeaderRow(h2);
    for (const c of codes) {
      const row = sheet.addRow(['', c]);
      styleBodyRow(row);
    }
  }

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 70;
}

// ─── HOJA: EXPERIENCIA ───────────────────────────────────────────────────────

function buildExperiencia(wb, data) {
  const sheet = wb.addWorksheet('Experiencia', {
    properties: { tabColor: { argb: COLORS.blue } },
    views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
  });
  addTitle(sheet, 'EXPERIENCIA REQUERIDA', 'General y específica detectadas en el pliego');

  // Experiencia general
  const headerG = sheet.addRow(['Actividad', 'Código', 'Descripción', 'Observación']);
  styleHeaderRow(headerG);
  for (const e of data.experienciaGeneral ?? []) {
    const row = sheet.addRow([e.actividad, e.codigo, e.descripcion, e.observacion]);
    styleBodyRow(row);
  }

  sheet.addRow([]);
  const subHeader = sheet.addRow(['EXPERIENCIA ESPECÍFICA']);
  sheet.mergeCells(`A${subHeader.number}:D${subHeader.number}`);
  const sCell = subHeader.getCell(1);
  sCell.font = { ...FONT_HEADER, color: { argb: COLORS.gray }, size: 11 };
  sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.graySoft } };
  sCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  const headerE = sheet.addRow(['Actividad', 'Tipo', 'Requisito', 'Observación']);
  styleHeaderRow(headerE);
  for (const e of data.experienciaEspecifica ?? []) {
    const row = sheet.addRow([e.actividad, e.tipo, e.requisito, e.observacion]);
    styleBodyRow(row);
  }

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 65;
  sheet.getColumn(4).width = 35;
}

// ─── HOJA: FINANCIERO ────────────────────────────────────────────────────────

function buildFinanciero(wb, data) {
  const sheet = wb.addWorksheet('Financiero', {
    properties: { tabColor: { argb: COLORS.gold } },
    views: [{ showGridLines: false }],
  });
  addTitle(sheet, 'CAPACIDAD FINANCIERA', 'Indicadores, capital de trabajo y capacidad residual');

  // Indicadores
  const h1 = sheet.addRow(['Indicador', 'Fórmula', 'Umbral', 'Observación']);
  styleHeaderRow(h1);
  for (const i of data.indicadoresFinancieros ?? []) {
    const row = sheet.addRow([i.indicador, i.formula, i.umbral, i.observacion]);
    styleBodyRow(row);
  }

  sheet.addRow([]);

  // Capital de trabajo
  const ct = data.capitalTrabajo ?? {};
  const h2 = sheet.addRow(['Capital de Trabajo (CTd)', 'Detalle']);
  styleHeaderRow(h2);
  const filasCT = [
    ['Fórmula',                  ct.formula],
    ['Plazo de ejecución',       ct.plazoEjecucion],
    ['Meses de apalancamiento',  ct.mesesApalancamiento],
    ['CTd estimado',             fmtCOP(ct.ctdEstimado)],
    ['¿Valor estimado?',         ct.ctdEsEstimado ? 'SÍ — calculado a partir del POE y plazo' : 'No — extraído del pliego'],
    ['Patrimonio demandado',     fmtCOP(ct.patrimonioDemandado)],
    ['Condición',                ct.condicion],
    ['Notas',                    ct.notas],
  ];
  for (const [k, v] of filasCT) {
    const row = sheet.addRow([k, clean(v)]);
    styleBodyRow(row);
    row.getCell(1).font = { ...FONT_BODY, bold: true };
  }

  sheet.addRow([]);

  // Capacidad residual
  const cr = data.capacidadResidual ?? {};
  const h3 = sheet.addRow(['Capacidad Residual', 'Detalle']);
  styleHeaderRow(h3);
  const filasCR = [
    ['CRPC estimado',     fmtCOP(cr.crpcEstimado)],
    ['¿Valor estimado?',  cr.crpcEsEstimado ? 'SÍ — usado el POE como aproximación' : 'No — extraído del pliego'],
    ['Fórmula CRPC',      cr.formulaCRPC],
    ['Fórmula CRP',       cr.formulaCRP],
  ];
  for (const [k, v] of filasCR) {
    const row = sheet.addRow([k, clean(v)]);
    styleBodyRow(row);
    row.getCell(1).font = { ...FONT_BODY, bold: true };
  }

  // Factores CRP
  sheet.addRow([]);
  const h4 = sheet.addRow(['Factor', 'Nombre', 'Puntaje', 'Descripción / Escala']);
  styleHeaderRow(h4);
  for (const f of cr.factores ?? []) {
    const row = sheet.addRow([f.factor, f.nombre, f.puntaje, f.escala ?? f.descripcion ?? '']);
    styleBodyRow(row);
  }

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 45;
}

// ─── HOJA: PUNTAJES ──────────────────────────────────────────────────────────

function buildPuntajes(wb, data) {
  const sheet = wb.addWorksheet('Puntajes', {
    properties: { tabColor: { argb: COLORS.gold } },
    views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
  });
  addTitle(sheet, 'CRITERIOS PONDERABLES', 'Puntajes asignados a los factores de evaluación');

  const headerRow = sheet.addRow(['Criterio', 'Puntos', 'Origen', 'Descripción', 'Documentos asociados']);
  styleHeaderRow(headerRow);

  let total = 0;
  for (const p of data.puntajes ?? []) {
    total += p.puntos ?? 0;
    const row = sheet.addRow([
      p.criterio,
      p.puntos,
      p.esValorPorDefecto ? 'Valor por defecto (template)' : 'Extraído del pliego',
      p.descripcion,
      p.documentos,
    ]);
    styleBodyRow(row, p.esValorPorDefecto ? COLORS.goldSoft : null);
  }

  const totalRow = sheet.addRow(['TOTAL', total, '', '', '']);
  totalRow.eachCell({ includeEmpty: false }, cell => {
    cell.font = { ...FONT_BODY, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } };
    cell.alignment = { vertical: 'middle' };
    cell.border = BORDER_ALL;
  });

  sheet.getColumn(1).width = 36;
  sheet.getColumn(2).width = 10;
  sheet.getColumn(3).width = 22;
  sheet.getColumn(4).width = 50;
  sheet.getColumn(5).width = 50;
}

// ─── HOJA: REQUISITOS HABILITANTES ───────────────────────────────────────────

function buildHabilitantes(wb, data) {
  const sheet = wb.addWorksheet('Habilitantes', {
    properties: { tabColor: { argb: COLORS.red } },
    views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }],
  });
  addTitle(sheet, 'REQUISITOS HABILITANTES', 'Obligatorios para no ser descartado en la fase de verificación');

  const headerRow = sheet.addRow(['Categoría', 'Requisito', 'Crítico', 'Documentos']);
  styleHeaderRow(headerRow);

  for (const h of data.requisitosHabilitantes ?? []) {
    const row = sheet.addRow([h.categoria, h.requisito, h.critico ? 'SÍ' : 'No', h.documentos]);
    styleBodyRow(row, h.critico ? COLORS.redSoft : null);
    row.getCell(3).alignment = { horizontal: 'center' };
  }

  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 45;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 55;
}

// ─── HOJA: PARÁMETROS Y ALERTAS ──────────────────────────────────────────────

function buildParametros(wb, data) {
  const sheet = wb.addWorksheet('Parámetros y Alertas', {
    properties: { tabColor: { argb: COLORS.red } },
    views: [{ showGridLines: false }],
  });
  addTitle(sheet, 'PARÁMETROS CLAVE Y ALERTAS CRÍTICAS', 'Síntesis para decidir si participar y bajo qué condiciones');

  const h1 = sheet.addRow(['Parámetro', 'Valor', 'Nivel', 'Advertencia']);
  styleHeaderRow(h1);
  for (const p of data.parametrosLicitar ?? []) {
    const row = sheet.addRow([p.parametro, p.valor, p.nivel?.toUpperCase() ?? '', p.advertencia]);
    const fill = p.nivel === 'critico' ? COLORS.redSoft
               : p.nivel === 'warning' ? COLORS.goldSoft
               : COLORS.greenSoft;
    styleBodyRow(row, fill);
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(3).font = { ...FONT_BODY, bold: true };
  }

  sheet.addRow([]);
  const h2 = sheet.addRow(['Tipo', 'Título', 'Descripción']);
  styleHeaderRow(h2);
  for (const a of data.alertasCriticas ?? []) {
    const row = sheet.addRow([a.tipo?.toUpperCase() ?? '', a.titulo, a.descripcion]);
    const fill = a.tipo === 'error' ? COLORS.redSoft : COLORS.goldSoft;
    styleBodyRow(row, fill);
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).font = { ...FONT_BODY, bold: true };
  }

  sheet.getColumn(1).width = 32;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 60;
}

// ─── ORQUESTADOR ─────────────────────────────────────────────────────────────

/**
 * Construye el workbook completo y dispara la descarga en el navegador.
 *
 * @param {object} data - Estructura completa devuelta por parsePliego.
 * @param {string} [filename] - Nombre del archivo (sin extensión).
 */
export async function exportToExcel(data, filename) {
  const wb = new ExcelJS.Workbook();
  wb.creator      = 'Analizador de Pliegos CCE';
  wb.created      = new Date();
  wb.lastModified = new Date();
  wb.title        = 'Análisis de Pliego CCE';

  buildPortada(wb, data);
  buildDocumentosPorTipo(wb, data);
  buildChecklistPlano(wb, data);
  buildResumen(wb, data);
  buildExperiencia(wb, data);
  buildFinanciero(wb, data);
  buildPuntajes(wb, data);
  buildHabilitantes(wb, data);
  buildParametros(wb, data);

  // Ajustar columnas (las que no fijamos manualmente)
  wb.eachSheet(sheet => {
    // Las hojas con columnas ya seteadas conservan sus widths
    if (!sheet.columns || !sheet.columns.length) autoFitColumns(sheet);
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const proceso = (data.resumen?.proceso ?? 'pliego').replace(/[^A-Za-z0-9_-]+/g, '_');
  const fname = (filename ?? `Analisis_${proceso}_${new Date().toISOString().slice(0, 10)}`) + '.xlsx';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
