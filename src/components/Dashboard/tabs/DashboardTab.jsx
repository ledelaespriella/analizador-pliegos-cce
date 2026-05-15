/**
 * DashboardTab — vista general: gráfica de puntajes, parámetros clave,
 * documentos críticos y resumen de experiencia específica.
 */
import { CHART_COLORS } from '../../../utils/constants.js';

export default function DashboardTab({ data }) {
  const totalPts = (data.puntajes ?? []).reduce((s, p) => s + (p.puntos ?? 0), 0);

  return (
    <div className="two-col">
      {/* Distribución de Puntajes */}
      <div className="panel">
        <div className="panel-title"><span>🎯</span>Distribución de Puntajes</div>
        <div className="mini-chart">
          {(data.puntajes ?? []).map((p, i) => {
            const pct = totalPts > 0 ? (p.puntos / totalPts) * 100 : 0;
            return (
              <div key={i} className="chart-bar-row">
                <div className="chart-bar-label">{p.criterio}</div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}>
                    <span>{p.puntos}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parámetros clave */}
      <div className="panel">
        <div className="panel-title"><span>⚡</span>Parámetros Clave para Licitar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data.parametrosLicitar ?? []).slice(0, 8).map((p, i) => {
            const cls = p.nivel === 'critico' ? 'badge-red' : p.nivel === 'warning' ? 'badge-gold' : 'badge-green';
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{p.parametro}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{p.valor}</div>
                </div>
                <span className={`badge ${cls}`} style={{ flexShrink: 0 }}>
                  {p.nivel === 'critico' ? 'CRÍTICO' : p.nivel === 'warning' ? 'ALERTA' : 'OK'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentos críticos */}
      <div className="panel">
        <div className="panel-title"><span>📋</span>Documentos Críticos</div>
        {(data.checklist ?? []).filter(c => c.critico).slice(0, 6).map((c, i) => (
          <div key={i} className="check-item" style={{ marginBottom: 6 }}>
            <span className="check-icon">🔴</span>
            <div className="check-content">
              <div className="check-name">{c.documento}</div>
              <div className="check-desc">{c.observacion}</div>
            </div>
            <div className="check-type"><span className="badge badge-red">CRÍTICO</span></div>
          </div>
        ))}
      </div>

      {/* Experiencia específica */}
      <div className="panel">
        <div className="panel-title"><span>🏗️</span>Experiencia Específica Requerida</div>
        {(data.experienciaEspecifica ?? []).length > 0
          ? (data.experienciaEspecifica).map((e, i) => (
              <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{e.actividad}</span>
                  <span className="badge badge-gold">{e.tipo}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{e.requisito}</div>
              </div>
            ))
          : <p style={{ fontSize: 13, color: 'var(--text2)' }}>No se encontraron actividades de experiencia específica en el documento.</p>
        }
      </div>
    </div>
  );
}
