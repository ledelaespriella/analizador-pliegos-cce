/**
 * @file ResumenTab.jsx — Tabla con todos los campos del resumen ejecutivo.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 */
export default function ResumenTab({ data }) {
  const labels = {
    proceso:      'Número del Proceso',
    objeto:       'Objeto del Contrato',
    entidad:      'Entidad Contratante',
    nit:          'NIT',
    dependencia:  'Dependencia / Área Solicitante',
    tipoContrato: 'Tipo de Contrato',
    modalidad:    'Modalidad de Selección',
    presupuesto:  'Presupuesto Oficial',
    anticipo:     'Anticipo',
    formaPago:    'Forma de Pago',
    plazo:        'Plazo de Ejecución',
    lugar:        'Lugar de Ejecución',
    aiu:          'AIU Máximo',
    complejidad:  'Complejidad Técnica',
    fechaEstudios:'Fecha de Elaboración Estudios',
  };

  return (
    <div className="panel">
      <div className="panel-title"><span>📋</span>Resumen Ejecutivo del Proceso</div>
      <table className="data-table">
        <tbody>
          {Object.entries(data.resumen ?? {})
            .filter(([k]) => k !== 'unspsc')
            .map(([k, v], i) => (
              <tr key={i}>
                <td style={{ width: 220 }}>{labels[k] ?? k}</td>
                <td className="cell-value">{String(v)}</td>
              </tr>
            ))}
          {(data.resumen?.unspsc ?? []).map((u, i) => (
            <tr key={`u${i}`}>
              <td>{i === 0 ? 'Códigos UNSPSC' : ''}</td>
              <td className="cell-value">{u}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
