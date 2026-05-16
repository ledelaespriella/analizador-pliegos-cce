/**
 * @file vite.config.js — Configuracion de Vite para build y desarrollo.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * - base: './' permite desplegar en GitHub Pages en cualquier subdirectorio.
 * - El worker de PDF.js se sirve como asset estatico via ?url.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs:   ['pdfjs-dist'],
          exceljs: ['exceljs'],
        },
      },
    },
  },
});
