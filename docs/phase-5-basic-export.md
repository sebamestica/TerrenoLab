# Exportación Básica de Resultados

Este documento describe la especificación técnica, el comportamiento, y las restricciones de la fase de exportación de datos en TerrenoLab (Fase 5).

---

## 1. Reglas de Desbloqueo y Seguridad

La vista **Exportar** es la etapa final del flujo de trabajo y solo se desbloquea si el control de calidad de curvas (`contourQA`) está libre de bloqueadores:
* **Condición de desbloqueo**: `contourQA !== null && contourQA.blockers.length === 0`.
* **Advertencias**: Si existen advertencias de QA en las curvas o en la superficie base, se permite exportar pero se muestra de forma prominente una alerta amarilla en la interfaz:
  > **Los resultados tienen advertencias técnicas. Revise el QA antes de usar los archivos.**
* **Bloqueadores**: Si hay un solo bloqueador crítico (como coordenadas NaN/Infinity, más de 300 curvas estimadas, o segmentos fuera de límites), la vista se mantiene bloqueada.

---

## 2. Archivos Exportables en Fase 5

### A. CSV Limpio de Puntos Válidos (`terrenolab_puntos_limpios.csv`)
* **Contenido**: Solo los puntos que han pasado todos los filtros de validación y limpieza. Las filas corruptas o incoherentes son omitidas.
* **Columnas**: `id,x,y,z`
* **Opción Adicional**: Si se activa la casilla *"Incluir resumen de errores de validación"*, se descarga adicionalmente un archivo separado `terrenolab_errores_validacion.csv` con columnas `row,type,message` que detalla cada fila original rechazada y la causa del descarte.

### B. Imagen PNG del Visor Activo (`terrenolab_visor.png`)
* **Contenido**: Captura fotográfica exacta a resolución fija ($800\text{px} \times 600\text{px}$) del lienzo de dibujo.
* **Comportamiento**: Se monta una grilla offscreen para renderizar el visor conforme a la jerarquía de prioridad del flujo:
  1. Si se completaron las curvas, exporta el **visor de curvas vectoriales**.
  2. Si solo se completó el terreno, exporta el **visor de raster/heatmap IDW**.
  3. Si no, exporta la **nube de puntos** original.
* **Detalles Técnicos**: El renderizado offscreen incluye un fondo blanco puro (`#FFFFFF`), la escala métrica calculada, y la leyenda de colores de cota (Z) dibujada directamente dentro del búfer de píxeles del canvas (no overlays HTML).

### C. JSON Técnico del Análisis (`terrenolab_analisis.json`)
* **Contenido**: Un reporte estructurado detallando metadatos del proyecto, conteo de puntos, límites altimétricos, resultados del QA topográfico inicial, resolución y potencia de la superficie IDW, el QA de superficie, y estadísticas de las curvas.
* **Seguridad**: No se exporta la grilla tridimensional completa de celdas (`gridZ`), evitando la generación de archivos pesados no aptos para lectura rápida.

---

## 3. Sanitización de Nombres de Archivo

Para garantizar compatibilidad con sistemas operativos y programas de oficina/CAD, todos los nombres de archivo descargados se procesan con la función `sanitizeFilename`:
* Se remueven caracteres inválidos: `\ / : * ? " < > |`.
* Se reemplazan todos los espacios por guiones bajos `_`.
* Se restringe el nombre a caracteres alfanuméricos seguros y guiones/puntos.
* Se limita la longitud máxima a 80 caracteres (respetando la extensión del archivo).
* Si el nombre del dataset de entrada estuviera vacío, se asigna el prefijo genérico `archivo`.

---

## 4. Limitaciones y Fases Futuras

* **CAD Avanzado (Fase 6)**: El motor interno contiene soporte preliminar para exportar a **DXF** y **GeoJSON** (gracias a la estructura lineal segmentada de Marching Squares). Sin embargo, estas opciones se mantienen **fuera de la interfaz de usuario** en esta fase para garantizar la simplicidad del entregable básico.
* **Formatos de Oficina**: Las exportaciones a **Excel (XLSX)**, **PDF** o informes de texto enriquecido no están implementadas y se consideran para evoluciones futuras del sistema.
