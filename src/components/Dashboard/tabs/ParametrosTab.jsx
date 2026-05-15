/** ParametrosTab — parámetros clave con niveles de alerta. */
export default function ParametrosTab({ data }) {
  const LEVELS = {
    critico: { bg: 'rgba(230,57,70,0.07)',   border: 'rgba(230,57,70,0.25)',   badge: 'badge-red',   icon: '🚨' },
    warning: { bg: 'rgba(244,162,97,0.07)',   border: 'rgba(244,162,97,0.25)',  badge: 'badge-gold',  icon: '⚠️' },
    ok:      { bg: 'rgba(46,196,182,0.05)',   border: 'rgba(46,196,182,0.15)', badge: 'badge-green', icon: '✅' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="alert">
        <span className="alert-icon">🚨</span>
        <div className="alert-text">
          <strong>Advertencia: </strong>Los valores marcados como ESTIMADOS fueron calculados
          a partir de patrones del texto. Verifique siempre con el pliego definitivo publicado en SECOP II.
        </div>
      </div>

      {(data.parametrosLicitar ?? []).map((p, i) => {
        const lv = LEVELS[p.nivel] ?? LEVELS.ok;
        return (
          <div
            key={i}
            style={{
              background: lv.bg, border: `1px solid ${lv.border}`,
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{lv.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{p.parametro}</span>
                <span className={`badge ${lv.badge}`}>{p.nivel?.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--teal)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                {p.valor}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{p.advertencia}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
