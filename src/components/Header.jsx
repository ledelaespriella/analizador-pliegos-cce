/**
 * Header — barra de navegación fija superior.
 * Muestra el badge de "Análisis Local" cuando hay datos cargados.
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
