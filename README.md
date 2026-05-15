# Analizador de Pliegos CCE

Herramienta web que analiza Pliegos de Condiciones de **Colombia Compra Eficiente (CCE)** directamente en el navegador, sin depender de IA externa ni enviar datos a ningún servidor.

## Características

- **100 % local** — el PDF nunca sale del navegador del usuario.
- **Sin IA externa** — parser basado en expresiones regulares y heurísticas sobre los pliegos tipo CCE.
- **Sin backend** — desplegable como sitio estático en GitHub Pages, Netlify, Vercel, etc.
- Extrae automáticamente: datos generales, experiencia general y específica, indicadores financieros, capital de trabajo, capacidad residual, puntajes, checklist de documentos y parámetros críticos.

## Tecnologías

| Paquete | Uso |
|---------|-----|
| React 18 | UI |
| Vite 6 | Bundler / Dev server |
| pdfjs-dist 4 | Extracción de texto del PDF |
| gh-pages | Despliegue en GitHub Pages |

## Inicio rápido

```bash
git clone https://github.com/ledelaespriella/analizador-pliegos-cce.git
cd analizador-pliegos-cce
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## Despliegue en GitHub Pages

1. Asegúrate de haber hecho `git remote add origin https://github.com/ledelaespriella/analizador-pliegos-cce.git`.
2. Ejecuta:

```bash
npm run deploy
```

Esto construye el proyecto y publica la carpeta `dist/` en la rama `gh-pages`.

## Estructura del proyecto

```
src/
├── main.jsx                  # Punto de entrada React
├── App.jsx                   # Máquina de estados: home / loading / dashboard / error
├── styles/
│   └── theme.css             # Variables CSS, componentes base
├── hooks/
│   └── usePliego.js          # Estado global y ciclo de vida del análisis
├── parser/
│   ├── pdfExtractor.js       # Extracción de texto con PDF.js
│   ├── pliegoParser.js       # Orquestador de extractores
│   └── extractors/
│       ├── resumen.js        # Datos generales del proceso
│       ├── experiencia.js    # Experiencia general y específica
│       ├── financiero.js     # Indicadores, capital de trabajo, cap. residual
│       ├── puntajes.js       # Criterios de evaluación y metodología
│       ├── checklist.js      # Generador de checklist de documentos
│       └── parametros.js     # Parámetros clave y alertas críticas
├── components/
│   ├── Header.jsx
│   ├── UploadZone.jsx
│   ├── LoadingScreen.jsx
│   └── Dashboard/
│       ├── index.jsx         # KPI cards + selector de pestañas
│       └── tabs/             # Una pestaña por sección del dashboard
└── utils/
    ├── constants.js          # Colores, tabs, pasos de carga
    └── formatters.js         # fmtCOP, cleanText, parseMoneyString…
```

## Limitaciones conocidas

- Los PDFs **escaneados** (sin capa de texto) no pueden analizarse; se necesita la versión digital del pliego.
- La precisión del parser depende de que el pliego siga la estructura de los **Pliegos Tipo CCE**. Documentos muy atípicos pueden requerir revisión manual.
- Los valores de CTd y CRPC son **estimaciones** calculadas a partir del presupuesto y el plazo; verifique siempre con el pliego oficial en SECOP II.

## Contribuir

Pull requests bienvenidos. Para cambios grandes, abre un issue primero para discutir el alcance.

## Licencia

MIT
