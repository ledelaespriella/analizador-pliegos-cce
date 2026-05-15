/**
 * @file Header.jsx — Barra de navegacion fija superior.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Muestra el badge de "Analisis Local" cuando hay datos cargados.
 */
export default function Header({ hasData }) {
  return (
    <div className="header">
      <span className="header-icon">⚖️</span>
      <div>
        <div className="header-title">Analizador de Pliegos CCE</div>
        <div className="header-sub">Colombia Compra Eficiente · Licitación Pública</div>
      </div>
      <div className="header-badge">
        {hasData ? '✓ Análisis Local' : 'Sin IA · 100% Local'}
      </div>
    </div>
  );
}
