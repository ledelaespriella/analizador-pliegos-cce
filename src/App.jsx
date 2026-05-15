/**
 * App.jsx — componente raíz.
 *
 * Máquina de estados simple:
 *   home ──► loading ──► dashboard
 *                 └──► error ──► home
 *
 * Toda la lógica de negocio vive en usePliego();
 * App solo decide qué pantalla renderizar.
 */
import { usePliego }      from './hooks/usePliego.js';
import Header             from './components/Header.jsx';
import UploadZone         from './components/UploadZone.jsx';
import LoadingScreen      from './components/LoadingScreen.jsx';
import Dashboard          from './components/Dashboard/index.jsx';
import { fmtCOP }         from './utils/formatters.js';

export default function App() {
  const {
    state, data, history, loadingStep, error,
    processFile, loadFromHistory, resetToHome,
  } = usePliego();

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="app">
        <Header hasData={false} />
        <LoadingScreen step={loadingStep} />
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  if (state === 'dashboard' && data) {
    return (
      <div className="app">
        <Header hasData />
        <Dashboard data={data} onNew={resetToHome} />
      </div>
    );
  }

  // ── HOME / ERROR ──────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Header hasData={false} />

      <div style={{ padding: '20px 28px 0' }}>
        {/* Historial de sesión */}
        {history.length > 0 && (
          <>
            <div className="section-title">📂 Pliegos Analizados (sesión)</div>
            <div className="history-list">
              {history.slice(0, 3).map(h => (
                <div
                  key={h.id}
                  className="history-item"
                  onClick={() => loadFromHistory(h)}
                >
                  <span className="history-item-icon">📄</span>
                  <div>
                    <div className="history-item-name">{h.proceso}</div>
                    <div className="history-item-meta">{h.entidad}</div>
                  </div>
                  <div className="history-item-budget">{fmtCOP(h.presupuesto)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Zona de carga */}
      <UploadZone onFile={processFile} />

      {/* Mensaje de error */}
      {state === 'error' && (
        <div style={{ padding: '0 28px 40px', maxWidth: 700, margin: '0 auto' }}>
          <div className="error-box">
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Error al procesar el documento</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Pie de página informativo */}
      <div style={{ textAlign: 'center', padding: '0 28px 40px', color: 'var(--text2)', fontSize: 12 }}>
        <p>🔒 Todo el procesamiento ocurre en tu navegador · Sin IA externa · Sin envío de datos</p>
        <p style={{ marginTop: 4 }}>Optimizado para Pliegos Tipo CCE — Colombia Compra Eficiente</p>
      </div>
    </div>
  );
}
