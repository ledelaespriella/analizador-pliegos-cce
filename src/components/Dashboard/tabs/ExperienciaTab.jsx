/** ExperienciaTab — tablas de experiencia general y específica. */
export default function ExperienciaTab({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Experiencia General */}
      <div className="panel">
        <div className="panel-title"><span>📐</span>Experiencia General</div>
        {(data.experienciaGeneral ?? []).length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Código UNSPSC</th>
                <th>Descripción Exigida</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {data.experienciaGeneral.map((e, i) => (
                <tr key={i}>
                  <td><span className="badge badge-blue">{e.actividad}</span></td>
                  <td className="cell-value">{e.codigo}</td>
                  <td>{e.descripcion}</td>
                  <td style={{ color: 'var(--gold)', fontSize: 12 }}>{e.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            No se encontraron actividades de experiencia general. Verifique las secciones del pliego manualmente.
          </p>
        )}
      </div>

      {/* Experiencia Específica */}
      <div className="panel">
        <div className="panel-title"><span>🎯</span>Experiencia Específica</div>
        {(data.experienciaEspecifica ?? []).length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Tipo</th>
                <th>Requisito</th>
                <th>Documentos Válidos</th>
                <th>Observación Crítica</th>
              </tr>
            </thead>
            <tbody>
              {data.experienciaEspecifica.map((e, i) => (
                <tr key={i}>
                  <td><span className="badge badge-blue">{e.actividad}</span></td>
                  <td><span className="badge badge-gold">{e.tipo}</span></td>
                  <td>{e.requisito}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{e.documentos}</td>
                  <td className="cell-warning" style={{ fontSize: 12 }}>{e.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            No se encontraron actividades de experiencia específica. Verifique las secciones del pliego manualmente.
          </p>
        )}
      </div>
    </div>
  );
}
