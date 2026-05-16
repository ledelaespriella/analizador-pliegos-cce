/**
 * @file experiencia.test.js — Tests del extractor de experiencia general y especifica.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import { extractExperienciaGeneral, extractExperienciaEspecifica } from './experiencia.js';
import { PLIEGO_MUESTRA, PLIEGO_VACIO } from '../../../tests/fixtures/pliegoMuestra.js';

describe('extractExperienciaGeneral', () => {
  const lista = extractExperienciaGeneral(PLIEGO_MUESTRA);

  it('encuentra al menos una actividad principal', () => {
    const principal = lista.find(e => /PRINCIPAL/i.test(e.actividad));
    expect(principal).toBeDefined();
  });

  it('captura el codigo de la actividad (formato 6.1 / 7.2 …)', () => {
    const codes = lista.map(e => e.codigo);
    expect(codes.some(c => /^\d+\.\d+$/.test(c))).toBe(true);
  });

  it('la descripcion incluye la palabra PROYECTOS DE', () => {
    expect(lista.some(e => /PROYECTOS\s+DE/i.test(e.descripcion))).toBe(true);
  });

  it('asocia codigos UNSPSC como observacion cuando estan presentes', () => {
    const conUnspsc = lista.find(e => /UNSPSC/i.test(e.observacion));
    expect(conUnspsc).toBeDefined();
  });

  it('devuelve arreglo vacio si la seccion no existe', () => {
    expect(extractExperienciaGeneral(PLIEGO_VACIO)).toEqual([]);
  });
});

describe('extractExperienciaEspecifica', () => {
  const lista = extractExperienciaEspecifica(PLIEGO_MUESTRA);

  it('encuentra al menos un bloque de experiencia especifica', () => {
    expect(lista.length).toBeGreaterThanOrEqual(1);
  });

  it('los requisitos detectados tienen suficiente longitud (no son ruido)', () => {
    expect(lista.every(e => e.requisito.length > 15)).toBe(true);
  });
});
