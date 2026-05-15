/**
 * Constantes globales del analizador de pliegos CCE.
 * Centraliza textos, colores y configuraciones reutilizables.
 */

/** Prefijos de proceso reconocidos por CCE */
export const PROCESS_PREFIXES = [
  'LP', 'SA', 'SA-SBC', 'SA-SLPC', 'SASI', 'CD', 'MC', 'PA', 'CCNM',
  'LICITACION', 'LICITACIÓN',
];

/** Tipos de contrato frecuentes en obra pública */
export const CONTRACT_TYPES = [
  'OBRA PÚBLICA', 'SUMINISTRO', 'PRESTACIÓN DE SERVICIOS',
  'CONSULTORÍA', 'INTERVENTORÍA', 'CONCESIÓN',
];

/** Modalidades de selección CCE */
export const SELECTION_MODES = [
  'LICITACIÓN PÚBLICA',
  'SELECCIÓN ABREVIADA',
  'CONCURSO DE MÉRITOS',
  'CONTRATACIÓN DIRECTA',
  'MÍNIMA CUANTÍA',
];

/** Pasos del proceso de análisis (para la pantalla de carga) */
export const ANALYSIS_STEPS = [
  'Extrayendo texto del PDF…',
  'Identificando datos generales del proceso…',
  'Analizando requisitos habilitantes…',
  'Extrayendo experiencia requerida…',
  'Calculando indicadores financieros…',
  'Procesando criterios de puntaje…',
  'Generando checklist de documentos…',
  'Construyendo dashboard…',
];

/** Pestañas del dashboard */
export const TABS = [
  { id: 'dashboard',   label: '📊 Dashboard' },
  { id: 'resumen',     label: '📋 Resumen' },
  { id: 'experiencia', label: '🏗️ Experiencia' },
  { id: 'financiero',  label: '💰 Financiero' },
  { id: 'puntajes',    label: '🎯 Puntajes' },
  { id: 'checklist',   label: '✅ Checklist' },
  { id: 'parametros',  label: '🚨 Parámetros' },
];

/** Paleta de colores para gráficas */
export const CHART_COLORS = [
  'var(--teal)', 'var(--gold)', 'var(--blue)',
  'var(--green)', '#A78BFA', '#F87171',
];
