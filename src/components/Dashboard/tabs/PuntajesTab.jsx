/** PuntajesTab — barras de puntaje, tabla detallada y metodología. */
import { CHART_COLORS } from '../../../utils/constants.js';

export default function PuntajesTab({ data }) {
  const totalPts = (data.puntajes ?? []).reduce((s, p) => s + (p.puntos ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barras de puntaje */}
      <div className="panel">
        <div className="panel-title"><span>🎯</span>Tabla de Puntajes</div>
        <div className="score-section">
          {(data.puntajes ?? []).map((p, i) => {
            const pct = totalPts > 0 ? (p.puntos / totalPts) * 100 : 0;
            return (
              <div key={i} className="score-row">
                <div className="score-label">{p.criterio}</div>
                <div className="score-bar-wrap">
                  <div className="score-bar" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <div className="score-pts">{p.puntos} pts</div>
              </div>
            );
          })}
          <div className="score-row" style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="score-label" style={{ fontWeight: 700, color: 'var(--text)' }}>TOTAL</div>
            <div className="score-bar-wrap">
              <div className="score-bar" style={{ width: '100%', background: 'var(--teal)' }} />
            </div>
            <div className="score-pts" style={{ color: 'var(--teal)', fontWeight: 700 }}>{totalPts.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Detalle de factores */}
      <div className="panel">
        <div className="panel-title"><span>📋</span>Detalle de Factores</div>
        <table className="data-table">
          <thead>
            <tr><th>Criterio</th><th>Puntos</th><th>Cómo se Otorga</th><th>Documentos</th></tr>
          </thead>
          <tbody>
            {(data.puntajes ?? []).map((p, i) => (
              <tr key={i}>
                <td>{p.criterio}</td>
                <td><span className="badge badge-teal">{p.puntos} pts</span></td>
                <td style={{ fontSize: 12 }}>{p.descripcion}</td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>{p.documentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metodología */}
      <div className="panel">
        <div className="panel-title"><span>⚖️</span>Metodología de Evaluación</div>
        <div className="two-col">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>FASES DEL PROCESO</div>
            {(data.metodologiaEvaluacion?.fases ?? []).map((f, i) => (
              <div key={i} className="check-item" style={{ marginBottom: 8 }}>
                <span className="check-icon">{i === 0 ? '🔍' : '📊'}</span>
                <div className="check-content">
                  <div className="check-name">{f.fase}: {f.nombre}</div>
                  <div className="check-desc">{f.descripcion}</div>
                </div>
                <span className="badge badge-teal">{f.resultado}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>MÉTODOS DE PONDERACIÓN (TRM)</div>
            {(data.metodologiaEvaluacion?.metodosPonderacion ?? []).map((m, i) => (
              <div key={i} className="check-item" style={{ marginBottom: 8 }}>
                <span className="check-icon" style={{ fontFamily: 'DM Mono', fontSize: 13 }}>#{m.metodo}</span>
                <div className="check-content">
                  <div className="check-name">{m.nombre}</div>
                  <div className="check-desc">Centavos TRM: {m.rango} — {m.descripcion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
