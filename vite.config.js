import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuración Vite:
 * - base: './' permite desplegar en GitHub Pages en cualquier subdirectorio.
 * - El worker de PDF.js se sirve como asset estático vía ?url.
 */
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
          pdfjs: ['pdfjs-dist'],
        },
      },
    },
  },
});
