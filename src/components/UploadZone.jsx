/**
 * UploadZone — zona de arrastre/clic para cargar el PDF del pliego.
 */
import { useRef, useState } from 'react';

export default function UploadZone({ onFile }) {
  const fileRef  = useRef();
  const [isDrag, setIsDrag] = useState(false);

  const handleFiles = (files) => {
    const f = files?.[0];
    if (f?.type === 'application/pdf') onFile(f);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0 28px 40px' }}>
      <div
        className={`upload-zone${isDrag ? ' drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={e => { e.preventDefault(); setIsDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current.click()}
      >
        <span className="upload-icon">📑</span>
        <div className="upload-title">Carga tu Pliego de Condiciones</div>
        <div className="upload-sub">
          Arrastra el PDF aquí o haz clic para seleccionarlo.<br />
          El análisis ocurre 100% en tu navegador — sin enviar datos a servidores externos.
        </div>
        <div className="upload-formats">
          <span className="format-tag">Pliegos Tipo CCE</span>
          <span className="format-tag">Licitación Pública</span>
          <span className="format-tag">Selección Abreviada</span>
          <span className="format-tag">Obra Pública</span>
        </div>
        <button
          className="upload-btn"
          onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
        >
          Seleccionar PDF
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
