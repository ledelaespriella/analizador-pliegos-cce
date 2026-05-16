/**
 * @file checklist.test.js — Tests del generador de checklist de documentos.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import { buildChecklist } from './checklist.js';

const parsedBase = {
  resumen: { anticipo: '30%', aiu: '30%' },
  puntajes: [
    { criterio: 'Oferta Económica',                puntos: 48.5 },
    { criterio: 'Factor de Calidad',               puntos: 30 },
    { criterio: 'Apoyo a la Industria Nacional',   puntos: 20 },
    { criterio: 'MIPYME',                          puntos: 0.25 },
  ],
};

describe('buildChecklist', () => {
  it('genera documentos juridicos base (RUP, antecedentes, …)', () => {
    const items = buildChecklist(parsedBase);
    const nombres = items.map(i => i.documento);
    expect(nombres.some(n => /RUP/i.test(n))).toBe(true);
    expect(nombres.some(n => /Garant[ií]a\s+de\s+Seriedad/i.test(n))).toBe(true);
  });

  it('numera consecutivamente desde 1', () => {
    const items = buildChecklist(parsedBase);
    items.forEach((it, idx) => {
      expect(it.numero).toBe(idx + 1);
    });
  });

  it('incluye documentos de calidad cuando hay factor de calidad ponderable', () => {
    const items = buildChecklist(parsedBase);
    expect(items.some(i => /Personal\s+Profesional\s+Clave/i.test(i.documento))).toBe(true);
  });

  it('omite documentos de calidad si no hay ese ponderable', () => {
    const sinCalidad = { ...parsedBase, puntajes: parsedBase.puntajes.filter(p => p.criterio !== 'Factor de Calidad') };
    const items = buildChecklist(sinCalidad);
    expect(items.some(i => /Personal\s+Profesional\s+Clave/i.test(i.documento))).toBe(false);
  });

  it('incluye garantia de anticipo solo si hay anticipo > 0', () => {
    const con = buildChecklist(parsedBase);
    const sin = buildChecklist({ ...parsedBase, resumen: { anticipo: 'No especificado en el pliego' } });
    expect(con.some(i => /Buen\s+Manejo\s+del\s+Anticipo/i.test(i.documento))).toBe(true);
    expect(sin.some(i => /Buen\s+Manejo\s+del\s+Anticipo/i.test(i.documento))).toBe(false);
  });

  it('agrega documento MIPYME cuando el criterio aparece', () => {
    const items = buildChecklist(parsedBase);
    expect(items.some(i => /Certificado\s+MIPYME/i.test(i.documento))).toBe(true);
  });

  it('todos los items criticos son HABILITANTES o ECONOMICO obligatorio', () => {
    const items = buildChecklist(parsedBase);
    const criticos = items.filter(i => i.critico);
    expect(criticos.length).toBeGreaterThan(0);
    expect(criticos.every(i => /HABILITANTE|ECON[OÓ]MICO/.test(i.tipo))).toBe(true);
  });
});
