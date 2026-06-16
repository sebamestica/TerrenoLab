# Roadmap de Desarrollo - TerrenoLab

Este documento presenta la planificación por fases para la evolución de TerrenoLab.

---

## [x] Fase 0: Arquitectura Limpia
* **Objetivo**: Diseñar la estructura monolítica local limpia.
* **Hitos**:
  - Definición de tipos de datos estables (`TerrainPoint`, `TerrainMetrics`, etc.).
  - Separación estricta de lógica de dominio (math/TS) y presentación (React/Canvas).
  - Implementación de la máquina de estados del flujo (`EMPTY` a `EXPORT_READY`).

## [x] Fase 0.1: UI Clean GIS
* **Objetivo**: Diseñar el layout fijo light theme definitivo.
  - Sidebar de 220px, Inspector de 320px, Topbar de 56px.
  - Paleta clara con acciones en cyan.

## [x] Fase 0.2: Limpieza de Alcance
* **Objetivo**: Garantizar que el visor y las exportaciones no parezcan cálculos reales prematuros.
  - Bloqueo de descargas de CSV, PNG y JSON.
  - Eliminación completa de stubs DXF y GeoJSON en la UI.
  - Inserción de avisos de diseño ("Vista de diseño") explícitos en mallas y curvas de nivel.

## [x] Fase 1: CSV Real + Validación + Nube de Puntos
* **Objetivo**: Lector de archivos CSV real de texto plano con delimitadores variables, mapeador de columnas y renderizado de nube de puntos 2D a escala real preservando la relación de aspecto.

## [x] Fase 1.1: Auditoría de Ingesta
* **Objetivo**: Auditar restricciones del visor, asegurar el bloqueo de estados futuros y documentar los límites de la importación y validación actual.

## [x] Fase 2: QA Topográfico Avanzado
* **Objetivo**: Motor de control de calidad QA expandido para detección avanzada de anomalías de medición y análisis topográfico enriquecido.

## [x] Fase 2.1: Ajuste de Bloqueo QA
* **Objetivo**: Separación de las condiciones de visualización (canReview) e interpolación (canInterpolate) para evitar bloqueos innecesarios en la nube de puntos 2D.

## [x] Fase 3: Interpolación IDW
* **Objetivo**: Implementar el algoritmo matemático de interpolación Inverse Distance Weighting (IDW) sobre la nube de puntos.

## [x] Fase 3.1: Auditoría de Superficie IDW
* **Objetivo**: Implementar el control de calidad altimétrico y matemático de la grilla de celdas interpoladas antes de habilitar curvas de nivel.

## [x] Fase 4: Curvas Reales
* **Objetivo**: Generación geométrica real de curvas maestras e intermedias mediante Marching Squares sobre la grilla IDW.

## [x] Fase 4.1: Auditoría de Curvas de Nivel
* **Objetivo**: Implementar un control de calidad completo (Contour QA) de los vectores y cotas generados antes de habilitar exportación.

## [x] Fase 5: Exportación Básica
* **Objetivo**: Descarga local de archivos de curvas de nivel y listados de puntos estructurados (CSV, PNG, JSON).

## [x] Fase 5.1: Auditoría de Exportaciones Básicas
* **Objetivo**: Implementar verificación dinámica y control de calidad de las exportaciones (CSV, PNG, JSON) para garantizar integridad de datos y evitar fugas técnicas.

## [x] Fase 5.2: Estabilización final del MVP y limpieza de experiencia
* **Objetivo**: Estabilizar la interfaz del MVP eliminando referencias de fases internas y stubs obsoletos.

## [x] Fase 5.3: Auditoría CRS y cierre técnico del MVP
* **Objetivo**: Corregir mapeos EPSG de zonas UTM chilenas y añadir metadatos de CRS a las exportaciones sin aplicar reproyección activa.

## [x] Fase 6: Exportaciones técnicas DXF y GeoJSON
* **Objetivo**: Implementar exportaciones en formatos DXF (CAD) y GeoJSON (GIS) de las curvas de nivel y puntos con colores de capa normalizados, metadatos en comentarios y avisos de coordenadas locales Cartesianas.

## [x] Fase 7: Herramienta de polígono y estimación preliminar de corte/relleno
* **Objetivo**: Permitir que el usuario delimite una zona mediante un polígono interactivo sobre la superficie IDW y calcule perímetros, áreas, volúmenes geométricos de corte/relleno, volumen recomendado de relleno compactado y una estimación preliminar de costos de compra de material y transporte fijo.

## [x] Fase 7.1: Auditoría de volumen, consistencia de costos y cierre del módulo corte/relleno
* **Objetivo**: Implementar un motor de consistencia altimétrica y de costos, elevar advertencias de parámetros negativos y auto-intersección de aristas a bloqueadores críticos de QA, y añadir avisos de precisión basados en el tamaño de muestreo de la grilla IDW.
