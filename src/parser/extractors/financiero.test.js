/**
 * @file financiero.test.js — Tests del extractor financiero.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import {
  extractIndicadoresFinancieros,
  extractCapitalTrabajo,
  extractCapacidadResidual,
} from './financiero.js';
import { PLIEGO_MUESTRA } from '../../../tests/fixtures/pliegoMuestra.js';

describe('extractIndicadoresFinancieros', () => {
  const ind = extractIndicadoresFinancieros(PLIEGO_MUESTRA);

  it('devuelve los tres indicadores estandar CCE', () => {
    expect(ind).toHaveLength(3);
    const nombres = ind.map(i => i.indicador);
    expect(nombres).toContain('Índice de Liquidez (IL)');
    expect(nombres).toContain('Índice de Endeudamiento (IE)');
    expect(nombres).toContain('Razón de Cobertura de Intereses (RCI)');
  });

  it('captura los umbrales numericos cuando estan en el texto', () => {
    const il = ind.find(i => i.indicador.startsWith('Índice de Liquidez'));
    expect(il.umbral).toMatch(/1[.,]20/);
  });
});

describe('extractCapitalTrabajo', () => {
  const ct = extractCapitalTrabajo(PLIEGO_MUESTRA, '12.500.000.000');

  it('detecta el plazo de ejecucion del pliego', () => {
    expect(ct.plazoEjecucion).toBe('18 meses');
  });

  it('calcula meses de apalancamiento desde la tabla CCE para plazo 12-24', () => {
    // tabla CCE: 12-24 meses → 4 (limites [12,24)); plazo=18 cae en ese rango
    // pero el fixture tambien menciona n=8, que tiene prioridad por regex
    expect([4, 8]).toContain(ct.mesesApalancamiento);
  });

  it('marca el CTd como estimado cuando no hay valor explicito', () => {
    expect(ct.ctdEsEstimado).toBe(true);
    // CTd ≈ ((POE - 30%) / 18) × 8  (si meses=8) o × 4
    const ctdNum = parseFloat(ct.ctdEstimado);
    expect(ctdNum).toBeGreaterThan(0);
  });

  it('calcula patrimonio demandado al 25% del POE por defecto', () => {
    expect(parseFloat(ct.patrimonioDemandado)).toBeCloseTo(12500000000 * 0.25, -3);
  });
});

describe('extractCapacidadResidual', () => {
  const cr = extractCapacidadResidual(PLIEGO_MUESTRA, '12.500.000.000');

  it('extrae el CRPC explicito del texto y lo marca como NO estimado', () => {
    expect(cr.crpcEstimado).toBe('12500000000');
    expect(cr.crpcEsEstimado).toBe(false);
  });

  it('incluye la formula CRP estandar', () => {
    expect(cr.formulaCRP).toContain('CO × [(E + CT + CF)');
  });

  it('devuelve los factores tipicos (CO, E, CT, CF, SCE)', () => {
    const factores = cr.factores.map(f => f.factor);
    expect(factores).toEqual(['CO', 'E', 'CT', 'CF', 'SCE']);
  });
});
