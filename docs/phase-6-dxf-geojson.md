# Exportaciones Técnicas: DXF y GeoJSON - TerrenoLab

Este documento detalla la estructura y el contenido de las exportaciones técnicas incorporadas en la Fase 6 de TerrenoLab, destinadas a la integración con software CAD (AutoCAD, Civil 3D) y herramientas GIS (QGIS, ArcGIS).

---

## 1. Archivo DXF (`terrenolab_curvas.dxf`)

El formato DXF (Drawing Exchange Format) permite transferir geometría vectorial nativa a sistemas CAD. Las curvas de nivel y los puntos del levantamiento se organizan de manera limpia mediante capas estándar de la industria.

### Estructura y Capas
El archivo DXF generado contiene una cabecera con comentarios de metadatos, una tabla de definición de capas con colores normalizados (ACI - AutoCAD Color Index) y las entidades geométricas correspondientes:

| Capa | ACI Color | Color Visual | Entidad DXF | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `BOUNDING_BOX` | `2` | Amarillo | `LINE` | Límite perimetral del levantamiento topográfico. |
| `TERRAIN_POINTS` | `3` | Verde | `POINT` | Nube de puntos de coordenadas reales ingresadas en el proyecto. |
| `CONTOURS` | `4` | Cian | `LINE` | Segmentos de curvas de nivel intermedias (normales). |
| `INDEX_CONTOURS` | `1` | Rojo | `LINE` | Segmentos de curvas de nivel maestras (índice). |

### Comentarios de Metadatos (Grupo 999)
En la sección `HEADER` y antes de cada entidad de línea se inyectan metadatos utilizando el grupo de código DXF `999` (comentarios legibles para desarrolladores y software compatible, pero ignorados en el renderizado CAD estándar):
* **Cota de la línea**: `Elevation: [z]`
* **Fecha de generación**
* **Sistema de Referencia (CRS)** descriptivo aplicado
* **Aviso de coordenadas locales**: Si el CRS es `LOCAL`, se agrega un comentario explícito advirtiendo que las coordenadas son planas Cartesianas.

### Guía de Importación en AutoCAD o Civil 3D
1. Descargue el archivo `[nombre_proyecto]_curvas.dxf` desde la pestaña Exportar de TerrenoLab.
2. Inicie AutoCAD o Civil 3D.
3. Use el comando `OPEN` (Abrir) y seleccione el tipo de archivo `.dxf`.
4. Si las coordenadas del proyecto son reales (por ejemplo, UTM), escriba el comando `ZE` (Zoom Extents / Zoom Extensión) para encuadrar la vista sobre la nube de puntos.
5. Abra el administrador de propiedades de capa (`LAYER`) para verificar los nombres de capa y cambiar los colores o grosores de línea si lo desea.

---

## 2. Archivo GeoJSON (`terrenolab_curvas.geojson`)

El formato GeoJSON codifica estructuras de datos geográficos vectoriales utilizando la notación JSON estándar. Es ideal para importaciones rápidas en herramientas de análisis territorial e ingeniería geoespacial.

### Estructura de Datos
El archivo sigue la especificación estándar de una `FeatureCollection`:
* **Geometry**: Cada nivel altimétrico se exporta como una entidad geométrica de tipo `MultiLineString` que agrupa todos los segmentos tridimensionales correspondientes a esa cota. Las coordenadas están representadas en 3D: `[X, Y, Z]` (donde `Z` coincide con la cota de la curva).
* **Properties**: Cada feature incluye las siguientes propiedades estructuradas:
  * `level`: Altura de la curva de nivel (en metros).
  * `isIndex`: Booleano que indica si es una curva maestra (`true`) o intermedia (`false`).
  * `interval`: Equidistancia configurada al generar las curvas (por ejemplo, `1.0` o `2.0` metros).
  * `source`: Constante `"TerrenoLab"`.
  * `method`: Constante `"IDW + Marching Squares"`.
  * `crsName`: Nombre descriptivo del sistema de coordenadas cargado.
  * `epsg`: Código EPSG numérico (o `null` si es local).
  * `reprojectionApplied`: Fijo en `false`.

* **Metadata**: Un bloque superior de metadatos del proyecto y del CRS aplicado para auditoría técnica:
  ```json
  "metadata": {
    "crs": {
      "type": "LOCAL" | "EPSG",
      "name": "WGS 84 / UTM Zona 19S",
      "epsg": 32719,
      "reprojectionApplied": false
    },
    "generatedBy": "TerrenoLab",
    "version": "MVP-Phase-6"
  }
  ```

### Guía de Importación en QGIS
1. Abra QGIS.
2. Arrastre y suelte el archivo `.geojson` directamente sobre la vista de mapa o use el menú *Capa > Añadir capa > Añadir capa vectorial...*
3. En la tabla de atributos de la capa, verá las columnas `level`, `isIndex`, `interval` y metadatos de generación.
4. Para dar estilo, haga doble clic sobre la capa en el panel izquierdo, vaya a *Simbología > Categorizado*, elija el valor `isIndex` y configure las curvas maestras con mayor grosor que las intermedias.
5. **Advertencia de proyección**: Si cargó coordenadas locales, aparecerá un aviso de advertencia sobre la falta de CRS geográfico asignado. Siga las instrucciones a continuación.

---

## 3. Limitaciones del Sistema de Referencia (CRS)

> [!IMPORTANT]
> **TERRENOLAB NO REPROYECTA COORDENADAS.**
> El sistema de coordenadas seleccionado en el selector superior de TerrenoLab es **meramente descriptivo**. Los archivos se exportarán con los mismos valores numéricos X/Y/Z cargados en el CSV original.

### Comportamiento según el CRS Seleccionado:
* **EPSG Asignado** (ej. `EPSG:32719`):
  El GeoJSON incluirá el bloque estándar `"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::32719" } }`. QGIS y Civil 3D reconocerán automáticamente el CRS proyectado, pero asumen que los valores numéricos ya están en ese sistema.
* **Sistema local XY** (`LOCAL`):
  Tanto el DXF como el GeoJSON se exportan como un plano XY Cartesiano neutro. El GeoJSON incluirá la siguiente propiedad de advertencia en su raíz:
  `"warning": "Advertencia: Las coordenadas son locales Cartesianas (XY) y no representan longitud/latitud geográfica real."`

---

## 4. Origen Matemático de las Curvas

Las curvas de nivel técnicas se generan secuencialmente mediante dos etapas de procesamiento numérico local:
1. **Interpolación IDW (Inverse Distance Weighting)**:
   La nube de puntos irregular se proyecta sobre una grilla regular de celdas (resolución configurada). Cada celda recibe una cota calculada a partir de los puntos más cercanos, ponderados por el recíproco de su distancia elevado al exponente de potencia `p` seleccionado.
2. **Trazado Marching Squares**:
   El motor recorre las celdas interpoladas y extrae líneas de contorno continuas mediante isolíneas interpoladas linealmente.
