/** ChecklistTab — lista completa de documentos a presentar. */
export default function ChecklistTab({ data }) {
  const list         = data.checklist ?? [];
  const criticos     = list.filter(c => c.critico).length;
  const habilitantes = list.filter(c => c.tipo?.includes('HABILITANTE')).length;
  const ponderables  = list.filter(c => c.tipo?.includes('PONDERABLE')).length;

  return (
    <div className="panel">
      <div className="panel-title"><span>✅</span>Checklist de Documentos ({list.length} ítems)</div>

      {/* Resumen de conteos */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <span className="badge badge-red">🔴 Críticos: {criticos}</span>
        <span className="badge badge-gold">🟡 Habilitantes: {habilitantes}</span>
        <span className="badge badge-green">🟢 Ponderables: {ponderables}</span>
      </div>

      <div className="check-list">
        {list.map((c, i) => {
          const icon     = c.critico ? '🔴' : c.tipo?.includes('PONDERABLE') ? '🟢' : '🟡';
          const badgeCls = c.critico ? 'badge-red' : c.tipo?.includes('PONDERABLE') ? 'badge-green' : 'badge-gold';
          // Etiqueta corta (última palabra del tipo)
          const label    = c.tipo?.split(' ').slice(-1)[0] ?? 'DOC';

          return (
            <div key={i} className="check-item">
              <span className="check-icon">{icon}</span>
              <div className="check-content">
                <div className="check-name">{c.numero}. {c.documento}</div>
                <div className="check-desc">{c.observacion}</div>
              </div>
              <div className="check-type">
                <span className={`badge ${badgeCls}`} style={{ fontSize: 10 }}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
