# Auditoría de Exportaciones Básicas (Fase 5.1)

Esta documentación describe la implementación de auditoría y validación de archivos exportados en TerrenoLab, garantizando la integridad, confidencialidad y consistencia de los datos técnicos antes de que se autorice su descarga por el usuario.

## Motivación

Antes de incorporar formatos avanzados como DXF (CAD) o GeoJSON (GIS), es crítico asegurar que las exportaciones básicas de la MVP (CSV, PNG, JSON) cumplan con criterios rigurosos de calidad de datos. Los errores o discrepancias en esta etapa podrían propagarse a herramientas de terceros y causar fallos en la interpretación del relieve o en el diseño de obras civiles.

## Criterios de Validación por Tipo de Archivo

El sistema realiza verificaciones reactivas automáticas para cada tipo de archivo seleccionado antes de permitir la exportación:

### 1. CSV Limpio (`_puntos_limpios.csv`)
- **Cabecera Estricta**: Debe coincidir exactamente con `id,x,y,z`.
- **Integridad Numérica**:
  - No se permiten valores vacíos, nulos (`null`), indefinidos (`NaN`) ni infinitos (`Infinity`).
  - Cada fila debe contener exactamente 4 columnas.
- **Formato**:
  - Se debe utilizar el punto decimal (`.`) para números fraccionarios.
  - La coma (`,`) se utiliza exclusivamente como separador de columnas.
- **Consistencia de Conteo**: El número de filas de datos debe coincidir exactamente con la cantidad de puntos válidos (`validPoints.length`).
- **Validación Cruzada**: Se comprueba que cada ID en el CSV corresponda con el punto original en el dataset interno.

### 2. CSV de Errores de Validación (`_errores_validacion.csv`)
- **Cabecera Estricta**: Debe coincidir exactamente con `row,type,message`.
- **Prevención de Fugas de Información**:
  - Se escanean los mensajes de error línea por línea para asegurar la ausencia de trazas técnicas de JavaScript (ej. `stack`, `at `, `TypeError`, `ReferenceError`, `undefined`, `[object Object]`, `null`).
  - Esto evita revelar detalles internos de la arquitectura del software en los reportes exportados al usuario final.

### 3. JSON Técnico de Análisis (`_analisis.json`)
- **Secciones Obligatorias**: El documento debe contener todas las claves maestras:
  - `project`: Metadatos del archivo origen.
  - `dataset`: Resumen del conteo de puntos y cotas Z extremas.
  - `topographicQA`: Calificación y métricas del QA topográfico inicial.
  - `surface`: Parámetros de interpolación IDW utilizados.
  - `surfaceQA`: Resultados del control de calidad de la superficie.
  - `contours`: Parámetros de equidistancia y conteo de curvas.
  - `contourQA`: Métricas geométricas de las curvas generadas.
  - `generatedBy` y `version`: Confirmación de auditoría firmada (`"TerrenoLab"`, `"MVP-Phase-5"`).
- **Límites de Peso (Exclusión de Arrays Pesados)**:
  - Se prohíbe explícitamente la presencia de las matrices de interpolación completas (`gridZ`, `gridX`, `gridY`) para evitar la generación de archivos JSON extremadamente pesados.
- **Filtro de Fugas de React**:
  - Se realiza una inspección recursiva en profundidad para bloquear cualquier exportación de estados internos de React o referencias a símbolos del framework (ej. claves que comiencen con `__react` o contengan `$$typeof` y `_react`).

### 4. PNG del Visor Técnico (`_visor.png`)
- **Dimensiones Mínimas**: Se requiere que las dimensiones del lienzo (`canvas`) de exportación sean mayores o iguales a $300\text{px} \times 250\text{px}$ para asegurar una resolución legible.
- **Detección de Lienzo Vacío**:
  - Se auditan los píxeles del lienzo capturado en un buffer fuera de pantalla (`offscreen canvas`).
  - Si no se encuentra ningún píxel con dibujo (que difiera del color de fondo blanco o transparente), la exportación del visor se reporta como vacía y se bloquea.

---

## Flujo de Datos y Reactividad

Para integrar estas validaciones de forma unificada:

1. **Estado Elevado**: Los estados de selección de archivos (`exportCSV`, `includeValidationErrors`, `exportPNG`, `exportJSON`), el timestamp de la última descarga y el estado del canvas se elevaron al controlador central (`page.tsx`).
2. **Memo de QA (`exportQA`)**: Se calcula reactivamente un objeto `exportQA` de tipo `ExportQAResult` en el controlador usando las funciones de auditoría del dominio puro (`src/domain/terrain/exportQA.ts`).
3. **Propiedades del Panel**: El resultado de la auditoría se distribuye al panel inspector lateral (`InspectorPanel.tsx`) y a la vista de descarga (`ExportView.tsx`), manteniendo sincronizados el listado de archivos válidos, bloqueadores, advertencias y el botón de descarga.
