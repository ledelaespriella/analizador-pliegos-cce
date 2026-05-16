/**
 * @file puntajes.test.js — Tests del extractor de criterios ponderables.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import {
  extractPuntajes,
  extractMetodologiaEvaluacion,
  extractRequisitosHabilitantes,
} from './puntajes.js';
import { PLIEGO_MUESTRA, PLIEGO_VACIO } from '../../../tests/fixtures/pliegoMuestra.js';

describe('extractPuntajes', () => {
  const puntajes = extractPuntajes(PLIEGO_MUESTRA);

  it('detecta los criterios principales del pliego', () => {
    const nombres = puntajes.map(p => p.criterio);
    expect(nombres).toContain('Oferta Económica');
    expect(nombres).toContain('Factor de Calidad');
    expect(nombres).toContain('Apoyo a la Industria Nacional');
  });

  it('extrae el valor numerico correcto de la oferta economica', () => {
    const oe = puntajes.find(p => p.criterio === 'Oferta Económica');
    expect(oe.puntos).toBeCloseTo(48.5);
    expect(oe.esValorPorDefecto).toBe(false);
  });

  it('la suma total se aproxima a 100 puntos para licitacion publica', () => {
    const total = puntajes.reduce((s, p) => s + p.puntos, 0);
    expect(total).toBeGreaterThanOrEqual(99);
    expect(total).toBeLessThanOrEqual(101);
  });

  it('cuando no encuentra nada devuelve defaults marcados como tales', () => {
    const fallback = extractPuntajes(PLIEGO_VACIO);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.every(p => p.esValorPorDefecto === true)).toBe(true);
  });
});

describe('extractMetodologiaEvaluacion', () => {
  const m = extractMetodologiaEvaluacion(PLIEGO_MUESTRA);

  it('expone las dos fases estandar (habilitantes + ponderables)', () => {
    expect(m.fases).toHaveLength(2);
    expect(m.fases[0].fase).toBe('Fase 1');
    expect(m.fases[1].fase).toBe('Fase 2');
  });

  it('detecta los cuatro metodos de ponderacion segun el TRM', () => {
    expect(m.metodosPonderacion).toHaveLength(4);
    expect(m.metodosPonderacion.map(x => x.metodo)).toEqual([1, 2, 3, 4]);
  });
});

describe('extractRequisitosHabilitantes', () => {
  const req = extractRequisitosHabilitantes(PLIEGO_MUESTRA);

  it('devuelve las tres categorias estandar', () => {
    const categorias = new Set(req.map(r => r.categoria));
    expect(categorias.has('JURÍDICO')).toBe(true);
    expect(categorias.has('FINANCIERO')).toBe(true);
    expect(categorias.has('TÉCNICO')).toBe(true);
  });

  it('todos los requisitos llevan flag critico activado', () => {
    expect(req.every(r => r.critico === true)).toBe(true);
  });
});
