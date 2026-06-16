# Arquitectura de TerrenoLab (Fase 0)

Este documento detalla las directrices arquitectónicas, la separación de capas y los fundamentos técnicos de la reconstrucción desde cero de TerrenoLab.

## 1. Principio de Separación de Capas

Para garantizar que el proyecto pueda escalar, se ha implementado una arquitectura limpia con desacoplamiento absoluto de responsabilidades:

```txt
┌────────────────────────────────────────────────────────────────┐
│ Presentación (React, Tailwind, HTML5 Canvas)                   │
│ Componentes UI, Layout Shell, Vistas de Workflow               │
└────────────────┬───────────────────────────────────────────────┘
                 │ Suscribe/Usa
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ Aplicación / Orquestación (Máquina de Estados de Flujo)       │
│ Controladores de Página, Hooks de UI, Estado de Navegación     │
└────────────────┬───────────────────────────────────────────────┘
                 │ Invoca funciones puras
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ Dominio / Matemáticas Puras (TypeScript sin dependencias)       │
│ Algoritmos, Métricas, Geometría, Interpolación, Validaciones  │
└────────────────────────────────────────────────────────────────┘
```

### Capa de Dominio (Pure Math/TS)
Ubicada en `src/domain/`. No contiene referencias a React, hooks (`useState`, `useEffect`) ni elementos visuales. Consiste únicamente en tipos y funciones puras:
- **`terrain/types.ts`**: Declaración de tipos fundamentales (`TerrainPoint`, `TerrainDataset`, `TerrainMetrics`).
- **`terrain/geometry.ts`**: Cálculos puramente geométricos como límites de cajas contenedoras y áreas.
- **`terrain/metrics.ts`**: Agregación de medidas topográficas (densidades, intervalos delta Z).
- **`terrain/validation.ts`**: Reglas sanitarias sobre integridad de datos antes de interpolar.
- **`terrain/interpolation.ts`**: Firmas y stubs para la aproximación de elevación (IDW).
- **`terrain/contours.ts`**: Firmas y stubs para segmentación de contornos (Marching Squares).
- **`workflow/`**: Reglas del ciclo de vida y habilitación de pasos del workflow.

### Capa de Presentación (UI/Viewers)
Ubicada en `src/components/` y `src/features/`. Su única responsabilidad es renderizar la información estructurada provista por el dominio y capturar interacciones del usuario:
- **Componentes UI (`/ui`)**: Bloques de interfaz genéricos reutilizables (botones, tarjetas, métricas).
- **Layout (`/layout`)**: Contenedor principal que estructura el espacio de trabajo en tres secciones: Barra superior de estado, Sidebar de workflow e Inspector lateral.
- **Viewers (`/viewers`)**: Renderizadores técnicos en 2D (utilizando Canvas nativo de HTML5 para optimizar el dibujo de miles de puntos y líneas vectoriales sin sobrecargar el DOM de React).

---

## 2. Decisiones de Diseño: 2D-First

TerrenoLab prioriza una interfaz **2D-First (Planta E/N)** por las siguientes razones:

1. **Claridad en la toma de decisiones**: Los agrimensores y diseñadores viales interpretan el relieve a partir de planos acotados de curvas de nivel y distribuciones de puntos en planta. El 3D es una herramienta de inspección estética secundaria.
2. **Eficiencia Computacional**: La renderización y optimización matemática de buffers 2D en Canvas permite un rendimiento óptimo en dispositivos móviles y portátiles de campo.
3. **Control de Flujo**: Permite consolidar la precisión métrica del levantamiento antes de generar representaciones volumétricas o mallas tridimensionales complejas.
