/**
 * @file formatters.test.js — Tests de las utilidades de formateo.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { describe, it, expect } from 'vitest';
import { fmtCOP, parseMoneyString, cleanText, truncate, capitalize } from './formatters.js';

describe('fmtCOP', () => {
  it('formatea miles de millones con MM COP', () => {
    expect(fmtCOP('12500000000')).toBe('$12.50 MM COP');
  });

  it('formatea millones con M COP', () => {
    expect(fmtCOP('250000000')).toBe('$250M COP');
  });

  it('devuelve guion para valores nulos o el sentinel del parser', () => {
    expect(fmtCOP(null)).toBe('—');
    expect(fmtCOP(undefined)).toBe('—');
    expect(fmtCOP('')).toBe('—');
    expect(fmtCOP('No especificado en el pliego')).toBe('—');
  });

  it('acepta numero o string en formato colombiano', () => {
    expect(fmtCOP(1500000000)).toBe('$1.50 MM COP');
    // El parser debe entender el formato colombiano (puntos como miles)
    expect(fmtCOP('1.500.000.000')).toBe('$1.50 MM COP');
  });
});

describe('parseMoneyString', () => {
  it('interpreta formato colombiano con punto como separador de miles', () => {
    expect(parseMoneyString('12.500.000.000')).toBe(12500000000);
  });

  it('interpreta formato europeo con coma decimal', () => {
    expect(parseMoneyString('1.500,75')).toBe(1500.75);
  });

  it('interpreta formato anglosajon con coma de miles y punto decimal', () => {
    expect(parseMoneyString('1,500.75')).toBe(1500.75);
  });

  it('devuelve null para entrada vacia o no numerica', () => {
    expect(parseMoneyString('')).toBeNull();
    expect(parseMoneyString(null)).toBeNull();
    expect(parseMoneyString('abc')).toBeNull();
  });
});

describe('cleanText', () => {
  it('normaliza saltos de linea y espacios multiples', () => {
    expect(cleanText('Hola   mundo\r\n\n\n\nFin')).toBe('Hola mundo\n\nFin');
  });

  it('elimina espacios al inicio y final', () => {
    expect(cleanText('   contenido   ')).toBe('contenido');
  });
});

describe('truncate', () => {
  it('no modifica textos cortos', () => {
    expect(truncate('hola', 10)).toBe('hola');
  });

  it('trunca con elipsis y respeta el limite', () => {
    const out = truncate('a'.repeat(150), 100);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBe(101); // 100 chars + elipsis
  });
});

describe('capitalize', () => {
  it('capitaliza la primera letra y baja el resto', () => {
    expect(capitalize('HOLA MUNDO')).toBe('Hola mundo');
  });

  it('devuelve cadena vacia para input vacio', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
  });
});
