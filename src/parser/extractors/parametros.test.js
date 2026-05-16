/**
 * @file parametros.test.js — Tests del generador de parametros y alertas.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import { buildParametrosYAlertas } from './parametros.js';

describe('buildParametrosYAlertas', () => {
  const parsedCompleto = {
    resumen: {
      presupuesto: '12500000000',
      plazo:       '18 meses',
      anticipo:    '30%',
      aiu:         '30%',
      complejidad: 'Alta',
      formaPago:   'Pagos parciales mensuales contra avance',
      unspsc:      ['72141103 - VIAS URBANAS'],
    },
    capitalTrabajo:    { ctdEstimado: '5000000000' },
    capacidadResidual: { crpcEstimado: '12500000000' },
  };

  it('clasifica el AIU como parametro critico', () => {
    const { parametrosLicitar } = buildParametrosYAlertas(parsedCompleto);
    const aiu = parametrosLicitar.find(p => /AIU/i.test(p.parametro));
    expect(aiu).toBeDefined();
    expect(aiu.nivel).toBe('critico');
  });

  it('genera alerta de error por capital de trabajo', () => {
    const { alertasCriticas } = buildParametrosYAlertas(parsedCompleto);
    expect(alertasCriticas.some(a => /Capital\s+de\s+Trabajo/i.test(a.titulo))).toBe(true);
  });

  it('marca la complejidad alta como nivel critico', () => {
    const { parametrosLicitar } = buildParametrosYAlertas(parsedCompleto);
    const cx = parametrosLicitar.find(p => /Complejidad/i.test(p.parametro));
    expect(cx.nivel).toBe('critico');
  });

  it('genera alerta cuando falta el presupuesto', () => {
    const sinPresup = {
      ...parsedCompleto,
      resumen: { ...parsedCompleto.resumen, presupuesto: 'No especificado en el pliego' },
    };
    const { alertasCriticas } = buildParametrosYAlertas(sinPresup);
    expect(alertasCriticas.some(a => /Presupuesto/i.test(a.titulo))).toBe(true);
  });

  it('siempre incluye una alerta indicando que valores son estimados', () => {
    const { alertasCriticas } = buildParametrosYAlertas(parsedCompleto);
    expect(alertasCriticas.some(a => /estimados/i.test(a.titulo + a.descripcion))).toBe(true);
  });
});
