/**
 * Dashboard — contenedor principal post-análisis.
 * Gestiona las KPI cards, el selector de pestañas y el renderizado de cada tab.
 */
import { useState } from 'react';
import { TABS }     from '../../utils/constants.js';
import { fmtCOP }   from '../../utils/formatters.js';

import DashboardTab  from './tabs/DashboardTab.jsx';
import ResumenTab    from './tabs/ResumenTab.jsx';
import ExperienciaTab from './tabs/ExperienciaTab.jsx';
import FinancieroTab from './tabs/FinancieroTab.jsx';
import PuntajesTab   from './tabs/PuntajesTab.jsx';
import ChecklistTab  from './tabs/ChecklistTab.jsx';
import ParametrosTab from './tabs/ParametrosTab.jsx';

export default function Dashboard({ data, onNew }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const d       = data;
  const r       = d.resumen ?? {};
  const ct      = d.capitalTrabajo ?? {};
  const totalPts = (d.puntajes ?? []).reduce((s, p) => s + (p.puntos ?? 0), 0);

  return (
    <div className="dashboard fade-in">
      {/* Encabezado del proceso */}
      <div className="dash-header">
        <div>
          <div className="dash-process-name">{r.proceso || 'Proceso sin número'}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4, maxWidth: 700 }}>{r.objeto}</div>
          <div className="dash-entity">{r.entidad}</div>
        </div>
        <div className="dash-actions">
          <button className="btn-outline" onClick={onNew}>← Nuevo pliego</button>
        </div>
      </div>

      {/* Alertas críticas */}
      {(d.alertasCriticas ?? [])
        .filter(a => a.tipo === 'error')
        .map((a, i) => (
          <div key={i} className="alert">
            <span className="alert-icon">🚨</span>
            <div className="alert-text">
              <strong>{a.titulo}: </strong>{a.descripcion}
            </div>
          </div>
        ))}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--accent': 'var(--teal)' }}>
          <span className="kpi-icon">💰</span>
          <div className="kpi-label">Presupuesto Oficial</div>
          <div className="kpi-value">{fmtCOP(r.presupuesto)}</div>
          <div className="kpi-sub">Incluido AIU</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--gold)' }}>
          <span className="kpi-icon">📅</span>
          <div className="kpi-label">Plazo de Ejecución</div>
          <div className="kpi-value">{r.plazo || '—'}</div>
          <div className="kpi-sub">Desde acta de inicio</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--blue)' }}>
          <span className="kpi-icon">🏗️</span>
          <div className="kpi-label">Anticipo</div>
          <div className="kpi-value">{r.anticipo || '—'}</div>
          <div className="kpi-sub">Del valor básico</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--red)' }}>
          <span className="kpi-icon">📊</span>
          <div className="kpi-label">Complejidad Técnica</div>
          <div className="kpi-value">{r.complejidad || '—'}</div>
          <div className="kpi-sub">{r.modalidad}</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--green)' }}>
          <span className="kpi-icon">💼</span>
          <div className="kpi-label">Capital Trabajo (CTd)</div>
          <div className="kpi-value">{fmtCOP(ct.ctdEstimado) || '—'}</div>
          <div className="kpi-sub">Mínimo requerido</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--gold)' }}>
          <span className="kpi-icon">🎯</span>
          <div className="kpi-label">Total Puntaje Máximo</div>
          <div className="kpi-value">{totalPts.toFixed(2)} pts</div>
          <div className="kpi-sub">Criterios ponderados</div>
        </div>
      </div>

      {/* Selector de pestañas */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'dashboard'   && <DashboardTab   data={d} />}
      {activeTab === 'resumen'     && <ResumenTab      data={d} />}
      {activeTab === 'experiencia' && <ExperienciaTab  data={d} />}
      {activeTab === 'financiero'  && <FinancieroTab   data={d} />}
      {activeTab === 'puntajes'    && <PuntajesTab     data={d} />}
      {activeTab === 'checklist'   && <ChecklistTab    data={d} />}
      {activeTab === 'parametros'  && <ParametrosTab   data={d} />}
    </div>
  );
}
