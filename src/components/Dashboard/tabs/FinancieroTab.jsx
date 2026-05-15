/**
 * @file FinancieroTab.jsx — Indicadores, capital de trabajo y capacidad residual.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
import { fmtCOP } from '../../../utils/formatters.js';

export default function FinancieroTab({ data }) {
  const ct = data.capitalTrabajo ?? {};
  const cr = data.capacidadResidual ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="two-col">
        {/* Indicadores Financieros */}
        <div className="panel">
          <div className="panel-title"><span>📊</span>Indicadores Financieros</div>
          {(data.indicadoresFinancieros ?? []).length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Indicador</th><th>Fórmula</th><th>Umbral Mínimo</th></tr>
              </thead>
              <tbody>
                {data.indicadoresFinancieros.map((ind, i) => (
                  <tr key={i}>
                    <td>{ind.indicador}</td>
                    <td className="cell-value" style={{ fontSize: 11 }}>{ind.formula}</td>
                    <td><span className="badge badge-gold">{ind.umbral}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>No se encontraron indicadores con umbrales explícitos.</p>
          )}
        </div>

        {/* Capital de Trabajo */}
        <div className="panel">
          <div className="panel-title"><span>💼</span>Capital de Trabajo</div>
          <table className="data-table">
            <tbody>
              <tr><td>Fórmula CTd</td><td className="cell-value">{ct.formula ?? '—'}</td></tr>
              <tr><td>Plazo ejecución</td><td className="cell-value">{ct.plazoEjecucion ?? '—'}</td></tr>
              <tr><td>Meses de apalancamiento (n)</td><td className="cell-value">{ct.mesesApalancamiento ?? '—'}</td></tr>
              <tr>
                <td>CTd estimado</td>
                <td className="cell-value" style={{ color: 'var(--teal)' }}>{fmtCOP(ct.ctdEstimado)}</td>
              </tr>
              <tr>
                <td>Patrimonio Demandado</td>
                <td className="cell-value" style={{ color: 'var(--teal)' }}>{fmtCOP(ct.patrimonioDemandado)}</td>
              </tr>
              <tr>
                <td>Condición</td>
                <td><span className="badge badge-green">{ct.condicion ?? 'CT ≥ CTd'}</span></td>
              </tr>
            </tbody>
          </table>
          {ct.notas && (
            <div className="alert alert-warn" style={{ marginTop: 12 }}>
              <span className="alert-icon">⚠️</span>
              <div className="alert-text">{ct.notas}</div>
            </div>
          )}
        </div>
      </div>

      {/* Capacidad Residual */}
      <div className="panel">
        <div className="panel-title"><span>🔢</span>Capacidad Residual del Proponente (CRP)</div>
        <div className="alert alert-warn" style={{ marginBottom: 16 }}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-text">
            <strong>CRPC estimado: {fmtCOP(cr.crpcEstimado)}</strong> — {cr.formulaCRPC}
          </div>
        </div>
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <span className="alert-icon">📐</span>
          <div className="alert-text">
            <strong>Fórmula CRP: </strong>{cr.formulaCRP}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Factor</th><th>Nombre</th><th>Descripción / Escala</th><th>Puntaje Máx.</th></tr>
          </thead>
          <tbody>
            {(cr.factores ?? []).map((f, i) => (
              <tr key={i}>
                <td><span className="badge badge-teal">{f.factor}</span></td>
                <td style={{ fontWeight: 600 }}>{f.nombre}</td>
                <td style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{f.escala ?? f.descripcion}</td>
                <td className="cell-value">{f.puntaje}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
