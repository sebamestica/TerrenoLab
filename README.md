# TerrenoLab

Workspace técnico para transformar datos topográficos en interpretación visual y decisiones preliminares.

## Descripción del Proyecto

TerrenoLab es una herramienta **2D-First** monolítica y local diseñada específicamente para el procesamiento de levantamientos topográficos (nubes de puntos), generación de superficies mediante grillas de interpolación y segmentación de curvas de nivel exportables a CAD y SIG.

No es un dashboard de propósito general, un CAD pesado, ni una landing page administrativa. Prioriza los datos limpios y la toma de decisiones basada en geometría.

## Stack Inicial (Fase 0)

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Librería**: React
- **Lógica**: Módulos matemáticos puros escritos en TypeScript independiente del framework de UI.
- **Rendimiento**: Renderizado basado en Canvas HTML5 para soportar nubes de puntos pesadas.

---

## Estructura de Directorios

```txt
terrenolab/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── WorkflowSidebar.tsx
│   │   │   └── InspectorPanel.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── StatusChip.tsx
│   │   │   └── DataMetric.tsx
│   │   │
│   │   └── viewers/
│   │       ├── Terrain2DViewer.tsx
│   │       ├── GridOverlay.tsx
│   │       └── ElevationLegend.tsx
│   │
│   ├── features/
│   │   ├── start/
│   │   │   └── StartView.tsx
│   │   ├── import/
│   │   │   └── ImportView.tsx
│   │   ├── validation/
│   │   │   └── ValidationView.tsx
│   │   ├── terrain/
│   │   │   └── TerrainReviewView.tsx
│   │   ├── surface/
│   │   │   └── SurfaceView.tsx
│   │   ├── contours/
│   │   │   └── ContoursView.tsx
│   │   └── export/
│   │       └── ExportView.tsx
│   │
│   ├── domain/
│   │   ├── terrain/
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   ├── metrics.ts
│   │   │   ├── geometry.ts
│   │   │   ├── interpolation.ts
│   │   │   └── contours.ts
│   │   │
│   │   └── workflow/
│   │       ├── workflowTypes.ts
│   │       └── workflowState.ts
│   │
│   ├── lib/
│   │   ├── csv/
│   │   │   └── csvParser.ts
│   │   ├── export/
│   │   │   └── exportUtils.ts
│   │   └── sampleData/
│   │       └── sampleTerrain.ts
│   │
│   └── styles/
│       └── tokens.ts
│
├── data_samples/
│   ├── README.md
│   └── terreno_prueba.csv
│
├── docs/
│   ├── architecture.md
│   ├── product-principles.md
│   ├── roadmap.md
│   └── mvp-status.md
│
├── package.json
└── README.md
```

---

## Comandos del Proyecto

### Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en su navegador para explorar la interfaz interactiva.

### Construir para Producción (Verificación)
```bash
npm run build
```

### Ejecutar Linter
```bash
npm run lint
```
