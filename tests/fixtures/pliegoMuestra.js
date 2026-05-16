/**
 * @file pliegoMuestra.js — Fragmento de texto representativo de un Pliego Tipo CCE.
 * @author Luis de la Espriella (@ledelaespriella)
 * @license BSL-1.1 — See LICENSE file for details.
 * @copyright 2026 Luis de la Espriella. All rights reserved.
 *
 * Texto sintetico que reproduce las secciones que los extractores buscan.
 * No es un pliego real: ha sido recortado y editado para ejercitar los regex
 * sin depender de un PDF externo (los tests deben correr en CI sin red).
 */

export const PLIEGO_MUESTRA = `
--- PÁGINA 1 ---
LICITACIÓN PÚBLICA — PLIEGOS TIPO LICITACIÓN DE OBRA PÚBLICA
NÚMERO DEL PROCESO: LP-001-2026
ENTIDAD CONTRATANTE: MUNICIPIO DE BARRANQUILLA
NIT: 890.102.018-1
Dependencia solicitante: Secretaría de Infraestructura

2.1 OBJETO:
"OBJETO: MEJORAMIENTO Y REHABILITACIÓN DE LAS VÍAS URBANAS DEL MUNICIPIO DE BARRANQUILLA — FASE II"

Tipo de contrato: OBRA PÚBLICA
La modalidad de selección será Licitación Pública.

PRESUPUESTO OFICIAL DEL PROCESO ($ 12.500.000.000) INCLUIDO IVA

Como anticipo un valor equivalente al 30% del valor básico del contrato.

Forma de Pago:
La Entidad realizará pagos parciales mensuales contra avance de obra debidamente certificado.

El plazo de ejecución del contrato será de DIECIOCHO (18) MESES de 30 días contados a partir del acta de inicio.

El lugar de ejecución del contrato está localizado en MUNICIPIO DE BARRANQUILLA.

El AIU no podrá exceder treinta por ciento (30%) del valor total.

El proyecto se considera de ALTA COMPLEJIDAD: requiere clasificación específica en RUP.

Fecha de elaboración de los estudios previos: 10 DE ENERO DE 2026

72141103 CONSTRUCCIÓN DE VÍAS URBANAS Y PAVIMENTOS
72141104 REHABILITACIÓN DE VÍAS Y CARRETERAS

--- PÁGINA 2 ---
3.5 EXPERIENCIA

3.5.1 DETERMINACIÓN DE LA EXPERIENCIA REQUERIDA

ACTIVIDAD PRINCIPAL:
6.1 PROYECTOS DE INFRAESTRUCTURA VIAL — Construcción, mejoramiento o rehabilitación de vías urbanas o rurales.
Experiencia General: El proponente debe acreditar la ejecución de mínimo TRES (3) contratos cuya sumatoria sea igual o superior al 100% del presupuesto oficial.
Códigos UNSPSC asociados: 72141103, 72141104.

Experiencia Específica 1: Al menos uno (1) de los contratos acreditados debe corresponder a pavimentación de vías urbanas con valor mínimo del 50% del POE.

ACTIVIDAD SECUNDARIA 1:
7.2 PROYECTOS DE REDES DE ALCANTARILLADO Y ACUEDUCTO
Experiencia General: Acreditar al menos un (1) contrato relacionado con redes hidrosanitarias.

3.6 INDICADORES FINANCIEROS
Los indicadores se verificarán según la Matriz 2 – Indicadores financieros y organizacionales.

ÍNDICE DE LIQUIDEZ: >= 1.20
NIVEL DE ENDEUDAMIENTO: <= 0.70
RAZÓN DE COBERTURA DE INTERESES: >= 1.00

3.7 CAPITAL DE TRABAJO
CTd = ((POE - Anticipo) / Plazo) × n
Para un plazo de 18 meses corresponden n = 8 meses de apalancamiento.
P = AT - PT ≥ Pd
Pd = POE × 25%

3.11 CAPACIDAD RESIDUAL
CRPC >= $ 12.500.000.000
CRP = CO × [(E + CT + CF) / 100] – SCE

--- PÁGINA 3 ---
4. CRITERIOS PONDERABLES DE EVALUACIÓN

4.1 OFERTA ECONÓMICA — Hasta 48.5 PUNTOS
4.2 FACTOR DE CALIDAD — Hasta 30 PUNTOS
4.3 APOYO A LA INDUSTRIA NACIONAL — Hasta 20 PUNTOS
4.4 VINCULACIÓN DE PERSONAS CON DISCAPACIDAD — 1 PUNTO
4.5 EMPRESA DE MUJERES — 0.25 PUNTOS
4.6 MIPYME — 0.25 PUNTOS

MÉTODO 1: MEDIANA CON VALOR ABSOLUTO   TRM: 0.00–0.24
MÉTODO 2: MEDIA ARITMÉTICA PONDERADA   TRM: 0.25–0.49
MÉTODO 3: MENOR VALOR                  TRM: 0.50–0.74
MÉTODO 4: MEDIA GEOMÉTRICA CON ARITMÉTICA TRM: 0.75–0.99

5. REQUISITOS HABILITANTES
[detalle en la Matriz 1 – Capacidad jurídica, financiera y técnica]
`;

/** Pliego mínimo sin secciones reconocibles; usado para tests negativos. */
export const PLIEGO_VACIO = `
--- PÁGINA 1 ---
Este documento no contiene la estructura de un pliego tipo CCE.
Lorem ipsum dolor sit amet.
`;
