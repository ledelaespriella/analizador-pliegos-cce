/**
 * @file usePliego.js — Hook principal del ciclo de vida del analisis.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Gestiona el ciclo de vida del analisis:
 *  home → loading → dashboard | error
 *
 * Expone:
 *  - state        : 'home' | 'loading' | 'dashboard' | 'error'
 *  - data         : objeto JSON con datos del pliego analizado
 *  - history      : últimos 10 procesos analizados (en sesión)
 *  - loadingStep  : índice del paso actual (para la animación)
 *  - error        : mensaje de error si falla
 *  - processFile  : función para iniciar el análisis dado un File
 *  - loadFromHistory : carga un análisis previo
 *  - resetToHome  : vuelve a la pantalla inicial
 */

import { useState, useCallback, useEffect } from 'react';
import { extractTextFromPDF }    from '../parser/pdfExtractor.js';
import { parsePliego }           from '../parser/pliegoParser.js';
import { ANALYSIS_STEPS }        from '../utils/constants.js';

const HISTORY_KEY = 'pliego-cce.history.v1';
const HISTORY_MAX = 10;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Cuota llena o storage deshabilitado: ignoramos silenciosamente.
  }
}

function isPdfFile(file) {
  if (!file) return false;
  if (file.type === 'application/pdf') return true;
  // Algunos navegadores (o drag&drop desde ciertos clientes) no setean el MIME.
  return typeof file.name === 'string' && /\.pdf$/i.test(file.name);
}

export function usePliego() {
  const [state,       setState]       = useState('home');
  const [data,        setData]        = useState(null);
  const [history,     setHistory]     = useState(() => loadHistory());
  const [loadingStep, setLoadingStep] = useState(0);
  const [error,       setError]       = useState('');

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  /**
   * Inicia el análisis de un archivo PDF.
   * @param {File} file
   */
  const processFile = useCallback(async (file) => {
    if (!isPdfFile(file)) {
      setError('El archivo debe ser un PDF válido.');
      setState('error');
      return;
    }

    setState('loading');
    setLoadingStep(0);
    setError('');

    try {
      // Extracción de texto — progreso proporcional por página
      let extractStep = 0;
      const { text, numPages } = await extractTextFromPDF(file, (page, total) => {
        const newStep = Math.floor((page / total) * 2); // Pasos 0–1
        if (newStep > extractStep) {
          extractStep = newStep;
          setLoadingStep(newStep);
        }
      });

      if (!text || text.trim().length < 100) {
        throw new Error(
          'El PDF parece estar vacío o es un documento escaneado sin capa de texto. ' +
          'Prueba con una versión digital del pliego (texto seleccionable).'
        );
      }

      // Análisis semántico — cada extractor avanza el step
      const parsed = await parsePliego(text, (step) => {
        setLoadingStep(2 + step); // Pasos 2–12 (ANALYSIS_STEPS tiene 8 entradas)
      });

      setLoadingStep(ANALYSIS_STEPS.length - 1);
      setData(parsed);

      // Persistir en historial (máximo HISTORY_MAX, persistido en localStorage)
      setHistory(prev => [{
        id:          Date.now(),
        name:        file.name,
        proceso:     parsed.resumen?.proceso    ?? 'Sin número',
        entidad:     parsed.resumen?.entidad    ?? '—',
        presupuesto: parsed.resumen?.presupuesto ?? '—',
        data:        parsed,
      }, ...prev.slice(0, HISTORY_MAX - 1)]);

      setState('dashboard');

    } catch (err) {
      console.error('[usePliego] Error al procesar pliego:', err);
      setError(err.message ?? 'Error desconocido al procesar el documento.');
      setState('error');
    }
  }, []);

  /** Carga un análisis previo desde el historial */
  const loadFromHistory = useCallback((historyItem) => {
    setData(historyItem.data);
    setState('dashboard');
  }, []);

  /** Vuelve a la pantalla de inicio sin perder el historial */
  const resetToHome = useCallback(() => {
    setState('home');
  }, []);

  return {
    state,
    data,
    history,
    loadingStep,
    error,
    processFile,
    loadFromHistory,
    resetToHome,
  };
}
