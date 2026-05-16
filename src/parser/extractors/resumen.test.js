/**
 * @file resumen.test.js — Tests del extractor de datos generales del proceso.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import { extractResumen } from './resumen.js';
import { PLIEGO_MUESTRA, PLIEGO_VACIO } from '../../../tests/fixtures/pliegoMuestra.js';

describe('extractResumen — pliego representativo', () => {
  const r = extractResumen(PLIEGO_MUESTRA);

  it('reconoce el numero de proceso con prefijo CCE', () => {
    expect(r.proceso).toBe('LP-001-2026');
  });

  it('captura el objeto del contrato', () => {
    expect(r.objeto).toMatch(/MEJORAMIENTO Y REHABILITACI[OÓ]N/i);
  });

  it('detecta el presupuesto oficial', () => {
    expect(r.presupuesto).toContain('12.500.000.000');
  });

  it('extrae el plazo en meses', () => {
    expect(r.plazo).toMatch(/18.*MESES/i);
  });

  it('detecta anticipo y forma de pago', () => {
    expect(r.anticipo).toMatch(/30\s*%/);
    expect(r.formaPago).toMatch(/La\s+Entidad/i);
  });

  it('extrae el AIU como porcentaje numerico', () => {
    expect(r.aiu).toBe('30%');
  });

  it('detecta complejidad ALTA', () => {
    expect(r.complejidad?.toLowerCase()).toBe('alta');
  });

  it('reconoce la modalidad de seleccion', () => {
    expect(r.modalidad).toMatch(/Licitaci[oó]n\s+P[uú]blica/i);
  });

  it('lista los codigos UNSPSC encontrados', () => {
    expect(r.unspsc.length).toBeGreaterThanOrEqual(2);
    expect(r.unspsc.some(c => c.startsWith('72141103'))).toBe(true);
  });

  it('captura el NIT con formato colombiano', () => {
    expect(r.nit).toBe('890.102.018-1');
  });
});

describe('extractResumen — sin secciones reconocibles', () => {
  const r = extractResumen(PLIEGO_VACIO);

  it('devuelve placeholders en vez de fallar', () => {
    expect(r.proceso).toBe('No especificado en el pliego');
    expect(r.objeto).toBe('No especificado en el pliego');
    expect(r.unspsc).toEqual([]);
  });
});
