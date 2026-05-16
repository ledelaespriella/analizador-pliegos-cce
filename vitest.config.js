/**
 * @file vitest.config.js — Configuracion de Vitest para tests unitarios y de integracion.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Vitest comparte el grafo de modulos con Vite, por lo que no hace falta
 * configurar transpilacion: los archivos .js/.jsx se cargan tal cual.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 'node' es suficiente para el parser; el DOM solo se necesitaria para tests de UI.
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.{js,jsx}'],
    // Mostrar tiempos por archivo, útil para detectar tests lentos.
    reporters: ['default'],
  },
});
