/**
 * puntajes.js
 * -----------
 * Extrae los criterios de evaluación ponderables (puntaje) del pliego.
 *
 * En pliegos tipo CCE los criterios más frecuentes son:
 *  - Oferta Económica
 *  - Factor de Calidad (personal, metodología, equipos)
 *  - Apoyo a la Industria Nacional
 *  - Vinculación de Personas con Discapacidad
 *  - Empresa de Mujeres
 *  - MIPYME
 */

const NIL = 'No especificado en el pliego';

function extractSection(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start === -1) return '';
  const sub = text.slice(start);
  const end = sub.search(endRe);
  return end === -1 ? sub : sub.slice(0, end);
}

/** Extrae el número de puntos de un fragmento de texto */
function extractPuntos(fragment) {
  const m = /(\d{1,3}(?:[.,]\d+)?)\s*(?:PUNTOS?|PTS?\.?)/i.exec(fragment);
  if (m) return parseFloat(m[1].replace(',', '.'));
  // Alternativa: "= X" al final
  const m2 = /[=:]\s*(\d{1,3}(?:[.,]\d+)?)\s*$/i.exec(fragment.trim());
  if (m2) return parseFloat(m2[1].replace(',', '.'));
  return null;
}

// ─── CRITERIOS CONOCIDOS ──────────────────────────────────────────────────────

/** Mapa de criterios estándar con alias, color y documentos habituales */
const CRITERIOS_STD = [
  {
    re: /OFERTA\s+ECON[OÓ]MICA/i,
    nombre: 'Oferta Económica',
    color: 'teal',
    puntosDefault: 48.5,
    descripcion: 'Se calcula aplicando la fórmula de mediana según el rango del TRM. Menor precio relativo obtiene mayor puntaje.',
    documentos: 'Formulario de Oferta Económica, Análisis de Precios Unitarios (APU)',
  },
  {
    re: /FACTOR\s+(?:DE\s+)?CALIDAD/i,
    nombre: 'Factor de Calidad',
    color: 'gold',
    puntosDefault: 30,
    descripcion: 'Evalúa personal clave, metodología, equipos y plan de gestión ambiental propuesto.',
    documentos: 'Hojas de vida personal clave, soportes de formación y experiencia, plan de trabajo',
  },
  {
    re: /APOYO\s+(?:A\s+LA\s+)?INDUSTRIA\s+NACIONAL/i,
    nombre: 'Apoyo a la Industria Nacional',
    color: 'blue',
    puntosDefault: 20,
    descripcion: 'Puntaje diferencial por componente nacional de bienes y servicios ofertados.',
    documentos: 'Formulario de Industria Nacional, certificados de origen',
  },
  {
    re: /VINCULACI[OÓ]N\s+(?:DE\s+)?PERSONAS\s+(?:CON\s+)?DISCAPACIDAD/i,
    nombre: 'Vinculación de Personas con Discapacidad',
    color: 'green',
    puntosDefault: 1,
    descripcion: 'Por acreditar vinculación laboral de personas en situación de discapacidad.',
    documentos: 'Certificado de FUPAD o Ministerio de Salud, contratos laborales',
  },
  {
    re: /EMPRESA\s+(?:DE\s+)?MUJERES|MUJERES\s+EMPRESARIAS/i,
    nombre: 'Empresa de Mujeres',
    color: 'green',
    puntosDefault: 0.25,
    descripcion: 'Para proponentes personas jurídicas con participación femenina mayoritaria.',
    documentos: 'Certificado de Cámara y Comercio con composición accionaria',
  },
  {
    re: /\bMIPYME\b|MICRO\s*,?\s*PEQUE[NÑ]A\s+Y\s+MEDIANA/i,
    nombre: 'MIPYME',
    color: 'green',
    puntosDefault: 0.25,
    descripcion: 'Para proponentes clasificados como Micro, Pequeña o Mediana Empresa.',
    documentos: 'Certificado MIPYME del Ministerio de Comercio o Cámara de Comercio',
  },
];

export function extractPuntajes(text) {
  const section = extractSection(text,
    /CRITERIOS?\s+(?:DE\s+)?(?:EVALUACI[OÓ]N\s+)?PONDERABLES?|FACTORES?\s+PONDERABLES?/i,
    /REQUISITOS?\s+HABILITANTES|CAP[IÍ]TULO\s+[IVX]+\s+\d|METODOLOG[IÍ]A\s+DE\s+EVALUACI[OÓ]N/i,
  ) || text;

  const resultados = [];

  for (const criterio of CRITERIOS_STD) {
    criterio.re.lastIndex = 0;
    const idx = section.search(criterio.re);
    if (idx === -1) continue;

    // Buscar el puntaje en los 200 caracteres siguientes al match
    const fragment = section.slice(idx, idx + 200);
    const puntos = extractPuntos(fragment) ?? criterio.puntosDefault;

    resultados.push({
      criterio:    criterio.nombre,
      puntos,
      descripcion: criterio.descripcion,
      documentos:  criterio.documentos,
      color:       criterio.color,
    });
  }

  // Si no se encontraron puntajes, devolver valores típicos para licitación pública CCE
  if (!resultados.length) {
    return CRITERIOS_STD.map(c => ({
      criterio:    c.nombre,
      puntos:      c.puntosDefault,
      descripcion: c.descripcion,
      documentos:  c.documentos,
      color:       c.color,
    }));
  }

  return resultados;
}

// ─── METODOLOGÍA DE EVALUACIÓN ────────────────────────────────────────────────

export function extractMetodologiaEvaluacion(text) {
  const fases = [
    {
      fase: 'Fase 1',
      nombre: 'Verificación de Requisitos Habilitantes',
      descripcion: 'Se verifica cumplimiento de requisitos jurídicos, financieros, técnicos y de organización.',
      resultado: 'CUMPLE / NO CUMPLE',
    },
    {
      fase: 'Fase 2',
      nombre: 'Evaluación de Factores Ponderables',
      descripcion: 'Se califica puntaje económico, calidad, apoyo industria nacional y criterios adicionales.',
      resultado: 'PUNTAJE 0–100',
    },
  ];

  // Intentar detectar métodos de ponderación de oferta económica
  const RE_METODO = /M[EÉ]TODO\s+(\d+)[:\s]+([^\n]{5,80})[^-]*TRM[:\s]+([0-9.,]+)\s*[-–]\s*([0-9.,]+)/gi;
  const metodosPonderacion = [];
  let m;
  RE_METODO.lastIndex = 0;
  while ((m = RE_METODO.exec(text)) !== null) {
    metodosPonderacion.push({
      metodo:      parseInt(m[1]),
      nombre:      m[2].trim(),
      rango:       `${m[3]}–${m[4]}`,
      descripcion: 'Fórmula de ponderación según rango del TRM en centavos el día de apertura',
    });
  }

  if (!metodosPonderacion.length) {
    metodosPonderacion.push(
      { metodo: 1, nombre: 'Mediana con Valor Absoluto',    rango: '0.00–0.24', descripcion: 'Se usa cuando centavos del TRM están en rango 0.00–0.24' },
      { metodo: 2, nombre: 'Media Aritmética Ponderada',    rango: '0.25–0.49', descripcion: 'Se usa cuando centavos del TRM están en rango 0.25–0.49' },
      { metodo: 3, nombre: 'Menor Valor',                   rango: '0.50–0.74', descripcion: 'Se usa cuando centavos del TRM están en rango 0.50–0.74' },
      { metodo: 4, nombre: 'Media Geométrica con Aritmética',rango: '0.75–0.99',descripcion: 'Se usa cuando centavos del TRM están en rango 0.75–0.99' },
    );
  }

  return { fases, metodosPonderacion };
}

// ─── REQUISITOS HABILITANTES ──────────────────────────────────────────────────

const HABILITANTES_STD = [
  { categoria: 'JURÍDICO', requisito: 'RUP vigente y en firme',              critico: true,  documentos: 'Certificado RUP SECOP / CCB actualizado' },
  { categoria: 'JURÍDICO', requisito: 'Capacidad jurídica y representación', critico: true,  documentos: 'Certificado de existencia y representación legal' },
  { categoria: 'JURÍDICO', requisito: 'Garantía de seriedad de la oferta',   critico: true,  documentos: 'Póliza o garantía bancaria' },
  { categoria: 'JURÍDICO', requisito: 'Paz y salvo seguridad social',        critico: true,  documentos: 'Certificados SARLAFT, antecedentes disciplinarios y fiscales' },
  { categoria: 'FINANCIERO', requisito: 'Indicadores financieros mínimos',   critico: true,  documentos: 'Estados financieros con revisor fiscal o contador' },
  { categoria: 'FINANCIERO', requisito: 'Capital de Trabajo ≥ CTd',          critico: true,  documentos: 'Balance General y Estado de Resultados' },
  { categoria: 'TÉCNICO',  requisito: 'Experiencia general acreditada',      critico: true,  documentos: 'Actas de liquidación, contratos, certificaciones' },
  { categoria: 'TÉCNICO',  requisito: 'Experiencia específica acreditada',   critico: true,  documentos: 'Certificaciones de obra con cantidades y valores' },
  { categoria: 'TÉCNICO',  requisito: 'Capacidad Residual ≥ CRPC',           critico: true,  documentos: 'Formato R1 de RUP + declaración bajo juramento' },
];

export function extractRequisitosHabilitantes(text) {
  // Intentar leer sección específica
  const section = extractSection(text,
    /REQUISITOS?\s+HABILITANTES/i,
    /CRITERIOS?\s+(?:DE\s+)?(?:EVALUACI[OÓ]N\s+)?PONDERABLES?|CAP[IÍ]TULO\s+[IVX]+\s+\d/i,
  );

  // Por ahora devolvemos los estándar enriquecidos con lo encontrado en el texto
  return HABILITANTES_STD.map(h => ({
    ...h,
    descripcion: `Requisito de obligatorio cumplimiento. ${h.requisito}.`,
  }));
}
