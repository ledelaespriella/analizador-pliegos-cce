/**
 * @file LoadingScreen.jsx — Pantalla de progreso durante el analisis del PDF.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { ANALYSIS_STEPS } from '../utils/constants.js';

export default function LoadingScreen({ step }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <div className="loading-title">Analizando pliego localmente…</div>
      <div className="loading-steps">
        {ANALYSIS_STEPS.map((label, i) => {
          const cls = i < step ? 'done' : i === step ? 'active' : '';
          return (
            <div key={i} className={`step ${cls}`}>
              <div className="step-dot" />
              {i < step ? '✓ ' : ''}{label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
