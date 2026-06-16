# TerrenoLab MVP Status & Capabilities

Este documento resume el estado de desarrollo, capacidades implementadas y alcance del MVP de TerrenoLab (Fase 5.2).

## Capacidades Implementadas (En Alcance)

1. **Ingesta de Datos**:
   - Lectura de archivos en formato CSV y TXT (hasta 10 MB).
   - Mapeo dinámico y manual de columnas (`id`, `x`, `y`, `z`).
   - Carga rápida de un dataset de prueba.

2. **Validación de Datos**:
   - Detección automática de filas con valores no numéricos, vacías, NaN o Infinity.
   - Identificación de puntos duplicados en el plano XY.
   - Generación de advertencias y exclusión automática de filas corruptas.

3. **Control de Calidad (QA) Topográfico**:
   - Clasificación inteligente del dataset (Levantamiento irregular vs Grilla DEM regular).
   - Cálculo del score de aptitud general del terreno (Escala 0-100).
   - Métricas espaciales detalladas: área de cobertura, densidad de puntos y detección de outliers altimétricos (Z).

4. **Visualización y Visores 2D**:
   - Planta 2D de la nube de puntos con rampa de colores altimétricos.
   - Raster continuo (Heatmap) de la superficie interpolada por distancia inversa ponderada (IDW).
   - Curvas de nivel vectoriales reales delineadas usando el algoritmo Marching Squares.
   - Toggles de visibilidad de capas (Puntos, Grilla, Curvas).
   - Modo de visor Claro (por defecto) y Técnico (alto contraste con fondo oscuro).
   - Leyenda de cotas integrada en pantalla y escala bar física dinámica.

5. **Alineación Geodésica (CRS)**:
   - Soporte para Sistema de Referencia de Coordenadas (CRS) local por defecto.
   - Selector dinámico de zonas UTM chilenas:
     - WGS 84 / UTM Zonas 18S, 19S y 20S.
     - SIRGAS-Chile / UTM Zonas 18S, 19S y 20S.
   - Propagación automática de EPSG a la metadata y paneles del sistema.

6. **Exportación de Entregables**:
   - CSV depurado con puntos válidos procesados.
   - CSV con reporte de errores de validación (opcional).
   - JSON técnico detallado con la metadata de cálculo, estadísticas de grilla y resultados de QA (incluye CRS de salida).
   - Captura y exportación en formato PNG del visor técnico actual (con escala bar y leyenda grabadas en la imagen).

---

## Alcance Excluido (No Implementado en MVP)

Las siguientes características no forman parte de esta fase y están excluidas intencionalmente para garantizar la estabilidad técnica del flujo básico:

- **Delineación 3D**: Visualización interactiva en tres dimensiones.
- **Integración de Mapas / GPS**: Conexión con servicios de Google Maps, OpenStreetMap o lecturas directas de sensores GPS.
- **Bases de Datos Espaciales**: Almacenamiento o sincronización con PostGIS u otras bases de datos relacionales.
- **Perfiles A-B / Secciones**: Generación de perfiles longitudinales o transversales interactivos.
- **Formatos CAD/GIS Avanzados**: Exportación de archivos DXF o GeoJSON.
- **Modelos Digitales de Elevación (DEM) Estatales**: Integración con bases de datos DEM públicas de Chile (por ejemplo, IDE).
- **Asistentes de Inteligencia Artificial**: Regresiones automáticas o estimaciones predictivas de relieve.
