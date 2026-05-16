/**
 * @file pliegoParser.test.js — Test de integracion del orquestador completo.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * No mockea ningun extractor: prueba que la salida agregada cumple el contrato
 * que consume el Dashboard y el exportador a Excel.
 */
import { describe, it, expect } from 'vitest';
import { parsePliego } from './pliegoParser.js';
import { PLIEGO_MUESTRA } from '../../tests/fixtures/pliegoMuestra.js';

describe('parsePliego (integracion)', () => {
  it('devuelve la estructura completa esperada por el Dashboard', async () => {
    const data = await parsePliego(PLIEGO_MUESTRA);

    // Contrato de campos
    expect(data).toHaveProperty('resumen');
    expect(data).toHaveProperty('experienciaGeneral');
    expect(data).toHaveProperty('experienciaEspecifica');
    expect(data).toHaveProperty('indicadoresFinancieros');
    expect(data).toHaveProperty('capitalTrabajo');
    expect(data).toHaveProperty('capacidadResidual');
    expect(data).toHaveProperty('puntajes');
    expect(data).toHaveProperty('totalPuntaje');
    expect(data).toHaveProperty('metodologiaEvaluacion');
    expect(data).toHaveProperty('requisitosHabilitantes');
    expect(data).toHaveProperty('checklist');
    expect(data).toHaveProperty('parametrosLicitar');
    expect(data).toHaveProperty('alertasCriticas');
  });

  it('totalPuntaje coincide con la suma de los puntos individuales', async () => {
    const data = await parsePliego(PLIEGO_MUESTRA);
    const suma = data.puntajes.reduce((s, p) => s + p.puntos, 0);
    expect(data.totalPuntaje).toBeCloseTo(parseFloat(suma.toFixed(2)));
  });

  it('reporta los pasos de progreso via el callback', async () => {
    const steps = [];
    await parsePliego(PLIEGO_MUESTRA, (s) => steps.push(s));
    // Esperamos al menos los 10 pasos definidos en pliegoParser.js
    expect(steps).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });

  it('el checklist queda numerado sin huecos', async () => {
    const data = await parsePliego(PLIEGO_MUESTRA);
    data.checklist.forEach((it, idx) => expect(it.numero).toBe(idx + 1));
  });

  it('genera al menos un parametro critico cuando el pliego tiene AIU y complejidad alta', async () => {
    const data = await parsePliego(PLIEGO_MUESTRA);
    expect(data.parametrosLicitar.some(p => p.nivel === 'critico')).toBe(true);
  });
});
