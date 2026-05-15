/**
 * LoadingScreen — pantalla de progreso durante el análisis del PDF.
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
